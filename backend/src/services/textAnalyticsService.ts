/**
 * Serviço de Text Analytics para "Quem Mente Menos?"
 * Análise defensiva de sentimento e detecção de padrões linguísticos
 */

import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics';
import { logger } from '@/utils/logger';
import { ExternalServiceError } from '@/core/errors/CustomErrors';
import { CircuitBreaker } from '@/utils/circuitBreaker';
import { RetryPolicy } from '@/utils/retryPolicy';

export interface SentimentAnalysisResult {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  confidence: number;
  sentences: Array<{
    text: string;
    sentiment: string;
    scores: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
}

export interface KeyPhrasesResult {
  phrases: string[];
  relevanceScores: number[];
}

export interface EntityRecognitionResult {
  entities: Array<{
    text: string;
    category: string;
    subcategory?: string;
    confidence: number;
    offset: number;
    length: number;
  }>;
}

export interface TextAnalysisResult {
  sentiment: SentimentAnalysisResult;
  keyPhrases: KeyPhrasesResult;
  entities: EntityRecognitionResult;
  languageDetection: {
    language: string;
    confidence: number;
  };
  pii?: {
    redactedText: string;
    entities: Array<{
      text: string;
      category: string;
      confidence: number;
    }>;
  };
}

export class TextAnalyticsService {
  private client: TextAnalyticsClient;
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;
  
  constructor() {
    // Validação defensiva de configuração
    const endpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;
    const apiKey = process.env.AZURE_TEXT_ANALYTICS_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure Text Analytics não configurado');
    }
    
    // Validar formato do endpoint
    if (!endpoint.startsWith('https://')) {
      throw new Error('Endpoint Text Analytics deve usar HTTPS');
    }
    
    this.client = new TextAnalyticsClient(
      endpoint,
      new AzureKeyCredential(apiKey)
    );
    
    // Circuit breaker para proteção
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
    });
    
    // Retry policy com backoff
    this.retryPolicy = new RetryPolicy({
      maxRetries: 2,
      initialDelay: 1000,
      maxDelay: 5000,
      factor: 2,
    });
  }
  
  async analyzeText(text: string, language: string = 'pt'): Promise<TextAnalysisResult> {
    const timer = logger.startTimer();
    
    try {
      // Validação defensiva de entrada
      this.validateInput(text);
      
      // Executar análises em paralelo para performance
      const [sentiment, keyPhrases, entities, languageDetection, pii] = await Promise.allSettled([
        this.analyzeSentiment(text, language),
        this.extractKeyPhrases(text, language),
        this.recognizeEntities(text, language),
        this.detectLanguage(text),
        this.detectPII(text, language),
      ]);
      
      // Processar resultados com fallbacks
      const result: TextAnalysisResult = {
        sentiment: this.extractResult(sentiment, this.getDefaultSentiment()),
        keyPhrases: this.extractResult(keyPhrases, { phrases: [], relevanceScores: [] }),
        entities: this.extractResult(entities, { entities: [] }),
        languageDetection: this.extractResult(languageDetection, { language, confidence: 0.5 }),
        pii: this.extractResult(pii, undefined),
      };
      
      const duration = timer();
      logger.info('Análise de texto concluída', {
        operation: 'analyzeText',
        service: 'TextAnalyticsService',
        duration,
        metadata: {
          textLength: text.length,
          sentiment: result.sentiment.overall,
          keyPhrasesCount: result.keyPhrases.phrases.length,
          entitiesCount: result.entities.entities.length,
        },
      });
      
      logger.metric('text_analysis_duration', duration);
      
      return result;
      
    } catch (error) {
      logger.error('Falha na análise de texto', error, {
        operation: 'analyzeText',
        service: 'TextAnalyticsService',
      });
      
      // Graceful degradation - retornar análise básica
      return this.getFallbackAnalysis(text, language);
    }
  }
  
  private async analyzeSentiment(text: string, language: string): Promise<SentimentAnalysisResult> {
    return this.retryPolicy.execute(async () => {
      return this.circuitBreaker.execute(async () => {
        const [result] = await this.client.analyzeSentiment([text], language, {
          includeOpinionMining: true,
        });
        
        if (result.error) {
          throw new Error(`Sentiment analysis failed: ${result.error.message}`);
        }
        
        // Mapear resultado para nosso formato
        const sentenceAnalysis = result.sentences.map(s => ({
          text: s.text,
          sentiment: s.sentiment,
          scores: {
            positive: s.confidenceScores.positive,
            negative: s.confidenceScores.negative,
            neutral: s.confidenceScores.neutral,
          },
        }));
        
        // Calcular emoções baseadas em opinion mining
        const emotions = this.extractEmotions(result);
        
        return {
          overall: result.sentiment as any,
          scores: {
            positive: result.confidenceScores.positive,
            negative: result.confidenceScores.negative,
            neutral: result.confidenceScores.neutral,
          },
          confidence: Math.max(
            result.confidenceScores.positive,
            result.confidenceScores.negative,
            result.confidenceScores.neutral
          ),
          sentences: sentenceAnalysis,
          emotions,
        };
      });
    });
  }
  
  private async extractKeyPhrases(text: string, language: string): Promise<KeyPhrasesResult> {
    return this.retryPolicy.execute(async () => {
      return this.circuitBreaker.execute(async () => {
        const [result] = await this.client.extractKeyPhrases([text], language);
        
        if (result.error) {
          throw new Error(`Key phrase extraction failed: ${result.error.message}`);
        }
        
        // Calcular relevância baseada em frequência
        const phraseFrequency = new Map<string, number>();
        result.keyPhrases.forEach(phrase => {
          const count = (text.match(new RegExp(phrase, 'gi')) || []).length;
          phraseFrequency.set(phrase, count);
        });
        
        // Ordenar por relevância
        const sortedPhrases = Array.from(phraseFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10); // Top 10 frases
        
        return {
          phrases: sortedPhrases.map(([phrase]) => phrase),
          relevanceScores: sortedPhrases.map(([, count]) => count / sortedPhrases[0][1]),
        };
      });
    });
  }
  
  private async recognizeEntities(text: string, language: string): Promise<EntityRecognitionResult> {
    return this.retryPolicy.execute(async () => {
      return this.circuitBreaker.execute(async () => {
        const [result] = await this.client.recognizeEntities([text], language);
        
        if (result.error) {
          throw new Error(`Entity recognition failed: ${result.error.message}`);
        }
        
        return {
          entities: result.entities.map(e => ({
            text: e.text,
            category: e.category,
            subcategory: e.subCategory,
            confidence: e.confidenceScore,
            offset: e.offset,
            length: e.length,
          })),
        };
      });
    });
  }
  
  private async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const [result] = await this.client.detectLanguage([text]);
      
      if (result.error) {
        throw new Error(`Language detection failed: ${result.error.message}`);
      }
      
      return {
        language: result.primaryLanguage.iso6391Name,
        confidence: result.primaryLanguage.confidenceScore,
      };
    } catch (error) {
      // Fallback para português
      return { language: 'pt', confidence: 0.5 };
    }
  }
  
  private async detectPII(text: string, language: string): Promise<any> {
    try {
      const [result] = await this.client.recognizePiiEntities([text], language);
      
      if (result.error) {
        return undefined;
      }
      
      return {
        redactedText: result.redactedText,
        entities: result.entities.map(e => ({
          text: e.text,
          category: e.category,
          confidence: e.confidenceScore,
        })),
      };
    } catch (error) {
      // PII detection é opcional, não falhar se não disponível
      return undefined;
    }
  }
  
  private validateInput(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new ExternalServiceError(
        'Texto inválido para análise',
        'TextAnalyticsService',
        undefined,
        { operation: 'validateInput' }
      );
    }
    
    if (text.trim().length < 3) {
      throw new ExternalServiceError(
        'Texto muito curto para análise (mínimo 3 caracteres)',
        'TextAnalyticsService',
        undefined,
        { operation: 'validateInput', textLength: text.length }
      );
    }
    
    if (text.length > 5000) {
      throw new ExternalServiceError(
        'Texto muito longo para análise (máximo 5000 caracteres)',
        'TextAnalyticsService',
        undefined,
        { operation: 'validateInput', textLength: text.length }
      );
    }
  }
  
  private extractResult<T>(
    result: PromiseSettledResult<T>,
    fallback: T
  ): T {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    
    logger.warn('Análise parcial falhou, usando fallback', {
      operation: 'extractResult',
      service: 'TextAnalyticsService',
      metadata: { reason: result.reason },
    });
    
    return fallback;
  }
  
  private getDefaultSentiment(): SentimentAnalysisResult {
    return {
      overall: 'neutral',
      scores: {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
      },
      confidence: 0.34,
      sentences: [],
    };
  }
  
  private getFallbackAnalysis(text: string, language: string): TextAnalysisResult {
    // Análise básica local como fallback
    const words = text.toLowerCase().split(/\s+/);
    
    // Palavras positivas/negativas básicas
    const positiveWords = ['bom', 'ótimo', 'excelente', 'feliz', 'alegre', 'verdade'];
    const negativeWords = ['ruim', 'péssimo', 'triste', 'mentira', 'falso', 'não'];
    
    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;
    const total = positiveCount + negativeCount || 1;
    
    return {
      sentiment: {
        overall: positiveCount > negativeCount ? 'positive' : 
                negativeCount > positiveCount ? 'negative' : 'neutral',
        scores: {
          positive: positiveCount / total,
          negative: negativeCount / total,
          neutral: 1 - (positiveCount + negativeCount) / total,
        },
        confidence: 0.3, // Baixa confiança para análise fallback
        sentences: [],
      },
      keyPhrases: {
        phrases: [],
        relevanceScores: [],
      },
      entities: {
        entities: [],
      },
      languageDetection: {
        language,
        confidence: 0.5,
      },
    };
  }
  
  private extractEmotions(result: any): any {
    // Extrair emoções baseadas em opinion mining se disponível
    // Implementação simplificada - expandir conforme necessário
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
    };
  }
}

// Singleton export
export const textAnalyticsService = new TextAnalyticsService();