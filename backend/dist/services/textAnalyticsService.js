"use strict";
/**
 * Serviço de Text Analytics para "Quem Mente Menos?"
 * Análise defensiva de sentimento e detecção de padrões linguísticos
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.textAnalyticsService = exports.TextAnalyticsService = void 0;
const ai_text_analytics_1 = require("@azure/ai-text-analytics");
const logger_1 = require("@/utils/logger");
const CustomErrors_1 = require("@/core/errors/CustomErrors");
const circuitBreaker_1 = require("@/utils/circuitBreaker");
const retryPolicy_1 = require("@/utils/retryPolicy");
class TextAnalyticsService {
    client;
    circuitBreaker;
    retryPolicy;
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
        this.client = new ai_text_analytics_1.TextAnalyticsClient(endpoint, new ai_text_analytics_1.AzureKeyCredential(apiKey));
        // Circuit breaker para proteção
        this.circuitBreaker = new circuitBreaker_1.CircuitBreaker({
            failureThreshold: 3,
            resetTimeout: 30000,
            monitoringPeriod: 60000,
        });
        // Retry policy com backoff
        this.retryPolicy = new retryPolicy_1.RetryPolicy({
            maxRetries: 2,
            initialDelay: 1000,
            maxDelay: 5000,
            factor: 2,
        });
    }
    async analyzeText(text, language = 'pt') {
        const timer = logger_1.logger.startTimer();
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
            const result = {
                sentiment: this.extractResult(sentiment, this.getDefaultSentiment()),
                keyPhrases: this.extractResult(keyPhrases, { phrases: [], relevanceScores: [] }),
                entities: this.extractResult(entities, { entities: [] }),
                languageDetection: this.extractResult(languageDetection, { language, confidence: 0.5 }),
                pii: this.extractResult(pii, undefined),
            };
            const duration = timer();
            logger_1.logger.info('Análise de texto concluída', {
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
            logger_1.logger.metric('text_analysis_duration', duration);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Falha na análise de texto', error, {
                operation: 'analyzeText',
                service: 'TextAnalyticsService',
            });
            // Graceful degradation - retornar análise básica
            return this.getFallbackAnalysis(text, language);
        }
    }
    async analyzeSentiment(text, language) {
        return this.retryPolicy.execute(async () => {
            return this.circuitBreaker.execute(async () => {
                const [result] = await this.client.analyzeSentiment([text], language, {
                    includeOpinionMining: true,
                });
                if (result.error) {
                    throw new Error(`Sentiment analysis failed: ${result.error.message}`);
                }
                // Verificar se o resultado tem as propriedades esperadas
                if (!('sentiment' in result) || !('confidenceScores' in result) || !('sentences' in result)) {
                    throw new Error('Invalid sentiment analysis result format');
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
                    overall: result.sentiment,
                    scores: {
                        positive: result.confidenceScores.positive,
                        negative: result.confidenceScores.negative,
                        neutral: result.confidenceScores.neutral,
                    },
                    confidence: Math.max(result.confidenceScores.positive, result.confidenceScores.negative, result.confidenceScores.neutral),
                    sentences: sentenceAnalysis,
                    emotions,
                };
            });
        });
    }
    async extractKeyPhrases(text, language) {
        return this.retryPolicy.execute(async () => {
            return this.circuitBreaker.execute(async () => {
                const [result] = await this.client.extractKeyPhrases([text], language);
                if (result.error) {
                    throw new Error(`Key phrase extraction failed: ${result.error.message}`);
                }
                // Verificar se o resultado tem as propriedades esperadas
                if (!('keyPhrases' in result)) {
                    throw new Error('Invalid key phrases result format');
                }
                // Calcular relevância baseada em frequência
                const phraseFrequency = new Map();
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
    async recognizeEntities(text, language) {
        return this.retryPolicy.execute(async () => {
            return this.circuitBreaker.execute(async () => {
                const [result] = await this.client.recognizeEntities([text], language);
                if (result.error) {
                    throw new Error(`Entity recognition failed: ${result.error.message}`);
                }
                // Verificar se o resultado tem as propriedades esperadas
                if (!('entities' in result)) {
                    throw new Error('Invalid entity recognition result format');
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
    async detectLanguage(text) {
        try {
            const [result] = await this.client.detectLanguage([text]);
            if (result.error) {
                throw new Error(`Language detection failed: ${result.error.message}`);
            }
            // Verificar se o resultado tem as propriedades esperadas
            if (!('primaryLanguage' in result)) {
                throw new Error('Invalid language detection result format');
            }
            return {
                language: result.primaryLanguage.iso6391Name,
                confidence: result.primaryLanguage.confidenceScore,
            };
        }
        catch (error) {
            // Fallback para português
            return { language: 'pt', confidence: 0.5 };
        }
    }
    async detectPII(text, language) {
        try {
            const [result] = await this.client.recognizePiiEntities([text], language);
            if (result.error) {
                return undefined;
            }
            // Verificar se o resultado tem as propriedades esperadas
            if (!('redactedText' in result) || !('entities' in result)) {
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
        }
        catch (error) {
            // PII detection é opcional, não falhar se não disponível
            return undefined;
        }
    }
    validateInput(text) {
        if (!text || typeof text !== 'string') {
            throw new CustomErrors_1.ExternalServiceError('Texto inválido para análise', 'TextAnalyticsService', undefined, { operation: 'validateInput' });
        }
        if (text.trim().length < 3) {
            throw new CustomErrors_1.ExternalServiceError('Texto muito curto para análise (mínimo 3 caracteres)', 'TextAnalyticsService', undefined, { operation: 'validateInput' });
        }
        if (text.length > 5000) {
            throw new CustomErrors_1.ExternalServiceError('Texto muito longo para análise (máximo 5000 caracteres)', 'TextAnalyticsService', undefined, { operation: 'validateInput' });
        }
    }
    extractResult(result, fallback) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        logger_1.logger.warn('Análise parcial falhou, usando fallback', {
            operation: 'extractResult',
            service: 'TextAnalyticsService',
            metadata: { reason: result.reason },
        });
        return fallback;
    }
    getDefaultSentiment() {
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
    getFallbackAnalysis(text, language) {
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
    extractEmotions(_result) {
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
exports.TextAnalyticsService = TextAnalyticsService;
// Singleton export
exports.textAnalyticsService = new TextAnalyticsService();
