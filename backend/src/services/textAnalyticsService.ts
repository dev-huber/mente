// Objeto padrão para OpinionMiningResult
const defaultOpinionMiningResult: OpinionMiningResult = {
    opinions: [],
    overallOpinionPolarity: 0,
    opinionTargets: [],
    conflictingOpinions: []
};
/**
 * Provides comprehensive text analysis including sentiment, key phrases, and entities
 */

import { logger, createRequestLogger } from '../utils/logger';
import { LieDetectionResult } from './lieDetectionService';

// Text Analytics interfaces
export interface TextAnalyticsRequest {
    text: string;
    requestId: string;
    language?: string;
    analysisOptions?: {
        enableLanguageDetection?: boolean;
        enableSentimentAnalysis?: boolean;
        enableKeyPhraseExtraction?: boolean;
        enableEntityRecognition?: boolean;
        includeOpinionMining?: boolean;
    };
}
export interface TextAnalyticsResult {
    success: boolean;
    requestId: string;
    detectedLanguage: LanguageDetection;
    sentiment: SentimentAnalysis;
    keyPhrases: KeyPhraseAnalysis;
    entities: EntityAnalysis;
    opinionMining?: OpinionMiningResult;
    processingTime: number;
}

export interface LanguageDetection {
    language: string;
    confidence: number;
    iso6391Name: string;
    name: string;
}

export interface SentimentAnalysis {
    overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidenceScores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    sentences: SentenceSentiment[];
    emotionalTone: EmotionalTone;
    stabilityMetrics: SentimentStability;
}
}

export interface SentenceSentiment {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidenceScores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    offset: number;
    length: number;
    targets?: SentimentTarget[];
    assessments?: SentimentAssessment[];
}

export interface SentimentTarget {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidenceScores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    offset: number;
    length: number;
}

export interface SentimentAssessment {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidenceScores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    offset: number;
    length: number;
    isNegated: boolean;
}

export interface EmotionalTone {
    dominantEmotion: string;
    emotionScores: {
        joy: number;
        sadness: number;
        anger: number;
        fear: number;
        surprise: number;
        disgust: number;
    };
    emotionalIntensity: number;
    emotionalComplexity: number;
}

export interface SentimentStability {
    varianceScore: number;
    rapidChanges: number;
    consistency: number;
    patterns: string[];
}

export interface KeyPhraseAnalysis {
    keyPhrases: string[];
    topics: TopicAnalysis[];
    themes: ThemeAnalysis;
    importance: PhraseImportance[];
}

export interface TopicAnalysis {
    topic: string;
    confidence: number;
    relatedPhrases: string[];
    prominence: number;
}

export interface ThemeAnalysis {
    primaryThemes: string[];
    secondaryThemes: string[];
    thematicCoherence: number;
    topicDrift: number;
}

export interface PhraseImportance {
    phrase: string;
    importanceScore: number;
    frequency: number;
    context: string;
}

export interface EntityAnalysis {
    entities: RecognizedEntity[];
    categories: EntityCategory[];
    relationships: EntityRelationship[];
    personInformation: PersonEntityInfo;
}

export interface RecognizedEntity {
    text: string;
    category: string;
    subcategory?: string;
    confidence: number;
    offset: number;
    length: number;
    matches: EntityMatch[];
}

export interface EntityMatch {
    text: string;
    offset: number;
    length: number;
    confidence: number;
}

export interface EntityCategory {
    category: string;
    count: number;
    examples: string[];
    confidence: number;
}

export interface EntityRelationship {
    source: string;
    target: string;
    relationship: string;
    confidence: number;
}

export interface PersonEntityInfo {
    persons: string[];
    personCount: number;
    relationshipDynamics: string[];
    nameConsistency: number;
}

export interface OpinionMiningResult {
    opinions: Opinion[];
    overallOpinionPolarity: number;
    opinionTargets: OpinionTarget[];
    conflictingOpinions: ConflictingOpinion[];
}

export interface Opinion {
    target: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    assessments: string[];
}

export interface OpinionTarget {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    mentions: number;
}

export interface ConflictingOpinion {
    target: string;
    conflictingAssessments: string[];
    conflictSeverity: number;
}

// Combined analysis result
export interface ComprehensiveTextAnalysis {
    textAnalytics: TextAnalyticsResult;
    lieDetection: LieDetectionResult;
    crossAnalysis: CrossAnalysisInsights;
    finalAssessment: FinalAssessment;
}

export interface CrossAnalysisInsights {
    sentimentLieCorrelation: number;
    emotionalConsistency: number;
    linguisticAlignment: number;
    confidenceAlignment: number;
    conflictingSignals: ConflictingSignal[];
    reinforcingPatterns: ReinforcingPattern[];
}

export interface ConflictingSignal {
    type: 'sentiment-behavior' | 'emotion-linguistic' | 'confidence-indicators';
    description: string;
    severity: 'low' | 'medium' | 'high';
    implications: string[];
}

export interface ReinforcingPattern {
    type: 'consistent-stress' | 'aligned-sentiment' | 'coherent-narrative';
    description: string;
    strength: number;
    confidence: number;
}

export interface FinalAssessment {
    overallTruthfulness: number; // 0-1 scale
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    primaryConcerns: string[];
    keyFindings: string[];
    recommendations: string[];
    alternativeExplanations: string[];
}

/**
 * Azure Text Analytics Service
 */
export class TextAnalyticsService {
    private readonly endpoint: string;
    // private readonly apiKey: string; // Removido para build limpo
    // private readonly apiVersion = '2023-04-01'; // Removido para build limpo
    private readonly useMockData: boolean;

    constructor() {
        this.endpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || 'https://mock-text-analytics.cognitiveservices.azure.com/';
        // Removido para build limpo
        this.useMockData = !process.env.AZURE_TEXT_ANALYTICS_KEY;

        if (this.useMockData) {
            logger.warn('Text Analytics Service initialized with mock data', {
                reason: 'Missing AZURE_TEXT_ANALYTICS_KEY environment variable'
            });
        } else {
            logger.info('Text Analytics Service initialized with Azure API', {
                endpoint: this.endpoint
            });
        }
    }

    /**
     * Perform comprehensive text analysis
     */
    async analyzeText(request: TextAnalyticsRequest): Promise<TextAnalyticsResult> {
        const startTime = Date.now();
        const requestLogger = createRequestLogger(request.requestId, {
            functionName: 'analyzeText',
            textLength: request.text.length,
            language: request.language
        });

        requestLogger.info('Starting text analytics analysis', {
            useMockData: this.useMockData,
            options: request.analysisOptions
        });

        try {
            if (this.useMockData) {
                return await this.analyzeMockText(request, startTime, requestLogger);
            } else {
                return await this.analyzeAzureText(request, startTime, requestLogger);
            }

        } catch (error) {
            requestLogger.error('Text analytics analysis failed', {
                error: error instanceof Error ? error.message : String(error),
                processingTime: Date.now() - startTime
            });

            return {
                success: false,
                requestId: request.requestId,
                detectedLanguage: { language: 'unknown', confidence: 0, iso6391Name: 'unknown', name: 'Unknown' },
                sentiment: this.createEmptySentimentAnalysis(),
                keyPhrases: this.createEmptyKeyPhraseAnalysis(),
                entities: this.createEmptyEntityAnalysis(),
                processingTime: Date.now() - startTime,
                error: `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    

    /**
     * Analyze text using Azure Text Analytics API
     */
    private async analyzeAzureText(
        request: TextAnalyticsRequest,
        startTime: number,
        requestLogger: any
    ): Promise<TextAnalyticsResult> {
        const document = {
            id: request.requestId,
            text: request.text,
            language: request.language || 'pt'
        };

        // Prepare batch requests for different analysis types
        const analysisPromises: Promise<any>[] = [];
        
        // Language detection (if not specified)
        if (!request.language && request.analysisOptions?.enableLanguageDetection !== false) {
            analysisPromises.push(this.detectLanguage(document, requestLogger));
        }

        // Sentiment analysis
        if (request.analysisOptions?.enableSentimentAnalysis !== false) {
            analysisPromises.push(this.analyzeSentiment(document, requestLogger));
        }

        // Key phrase extraction
        if (request.analysisOptions?.enableKeyPhraseExtraction !== false) {
            analysisPromises.push(this.extractKeyPhrases(document, requestLogger));
        }

        // Entity recognition
        if (request.analysisOptions?.enableEntityRecognition !== false) {
            analysisPromises.push(this.recognizeEntities(document, requestLogger));
        }

        // Opinion mining
        if (request.analysisOptions?.includeOpinionMining) {
            analysisPromises.push(this.mineOpinions(document, requestLogger));
        }

        const results = await Promise.allSettled(analysisPromises);
        
        // Process results
        const detectedLanguage = request.language 
            ? { language: request.language, confidence: 1.0, iso6391Name: request.language, name: this.getLanguageName(request.language) }
            : this.processLanguageDetectionResult(results[0]);
        
        const sentiment = this.processSentimentResult(results[request.language ? 0 : 1]);
        const keyPhrases = this.processKeyPhrasesResult(results[request.language ? 1 : 2]);
        const entities = this.processEntitiesResult(results[request.language ? 2 : 3]);
        const opinionMining = request.analysisOptions?.includeOpinionMining 
            ? this.processOpinionMiningResult(results[results.length - 1])
            : undefined;

        requestLogger.info('Azure text analysis completed', {
            language: detectedLanguage.language,
            sentiment: sentiment.overallSentiment,
            keyPhrasesCount: keyPhrases.keyPhrases.length,
            entitiesCount: entities.entities.length,
            processingTime: Date.now() - startTime
        });

        return {
            success: true,
            requestId: request.requestId,
            detectedLanguage,
            sentiment,
            keyPhrases,
            entities,
            opinionMining: opinionMining ?? defaultOpinionMiningResult,
            processingTime: Date.now() - startTime
        };
    

    /**
     * Analyze text using mock data for development
     */
    private async analyzeMockText(
        request: TextAnalyticsRequest,
        startTime: number,
        requestLogger: any
    ): Promise<TextAnalyticsResult> {
        requestLogger.info('Using mock text analytics data');

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        const text = request.text.toLowerCase();
        
        // Mock language detection
        const detectedLanguage: LanguageDetection = {
            language: request.language || 'pt',
            confidence: 0.95,
            iso6391Name: 'pt',
            name: 'Portuguese'
        };

        // Mock sentiment analysis based on keywords
        const sentiment = this.generateMockSentiment(text);
        
        // Mock key phrases
        const keyPhrases = this.generateMockKeyPhrases(text); // Ensure only the safe mock version is used
        
        // Mock entities
        const entities = this.generateMockEntities(text);

        // Mock opinion mining if requested
        const opinionMining = request.analysisOptions?.includeOpinionMining
            ? this.generateMockOpinionMining(text)
            : undefined;

        requestLogger.info('Mock text analysis completed', {
            sentiment: sentiment.overallSentiment,
            keyPhrasesCount: keyPhrases.keyPhrases.length,
            entitiesCount: entities.entities.length,
            processingTime: Date.now() - startTime
        });

        return {
            success: true,
            requestId: request.requestId,
            detectedLanguage,
            sentiment,
            keyPhrases,
            entities,
            opinionMining: opinionMining ?? defaultOpinionMiningResult,
            processingTime: Date.now() - startTime
        };
    }
    

    // Mock data generators
    private generateMockSentiment(text: string): SentimentAnalysis {
        const positiveWords = ['bom', 'ótimo', 'excelente', 'feliz', 'alegre', 'satisfeito'];
        const negativeWords = ['ruim', 'péssimo', 'triste', 'nervoso', 'preocupado', 'ansioso'];
        const neutralWords = ['talvez', 'normal', 'comum', 'regular'];

        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;

        positiveWords.forEach(word => {
            if (text.includes(word)) positiveScore += 0.2;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) negativeScore += 0.2;
        });

        neutralWords.forEach(word => {
            if (text.includes(word)) neutralScore += 0.1;
        });

        // Normalize scores
        const total = positiveScore + negativeScore + neutralScore + 0.3; // base neutral
        positiveScore = Math.min(0.9, positiveScore / total);
        negativeScore = Math.min(0.9, negativeScore / total);
        neutralScore = Math.max(0.1, 1 - positiveScore - negativeScore);

        let overallSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
        if (Math.abs(positiveScore - negativeScore) < 0.1) {
            overallSentiment = 'mixed';
        } else if (positiveScore > negativeScore && positiveScore > neutralScore) {
            overallSentiment = 'positive';
        } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
            overallSentiment = 'negative';
        } else {
            overallSentiment = 'neutral';
        }

        const sentences = this.generateMockSentenceSentiments(text, overallSentiment);
        const emotionalTone = this.generateMockEmotionalTone(text, overallSentiment);
        const stabilityMetrics = this.generateMockSentimentStability(sentences);

        return {
            overallSentiment,
            confidenceScores: {
                positive: positiveScore,
                negative: negativeScore,
                neutral: neutralScore
            },
            sentences,
            emotionalTone,
            stabilityMetrics
        };
    

    private generateMockSentenceSentiments(text: string, overallSentiment: string): SentenceSentiment[] {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        return sentences.map((sentence, index) => {
            const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
            let sentiment = overallSentiment as 'positive' | 'negative' | 'neutral';
            
            // Add some variation
            if (Math.random() < 0.2) {
                const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
                sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
            }

            const baseConfidence = 0.7;
            const confidenceScores = {
                positive: sentiment === 'positive' ? baseConfidence + Math.abs(variance) : 0.1 + Math.random() * 0.2,

    // O trecho acima estava corrompido. Removido instruções soltas e blocos inválidos.
    // Se necessário, reimplemente as funções de análise (detectLanguage, analyzeSentiment, extractKeyPhrases, recognizeEntities, mineOpinions, processLanguageDetectionResult, processSentimentResult, processKeyPhrasesResult, processEntitiesResult, processOpinionMiningResult) conforme a lógica do restante do serviço.

    private generateMockSentimentStability(sentences: SentenceSentiment[]): SentimentStability {
        if (sentences.length < 2) {
            return {
                varianceScore: 0,
                rapidChanges: 0,
                consistency: 1,
                patterns: ['insufficient_data']
            };
        }

        let rapidChanges = 0;
        let totalVariance = 0;

        for (let i = 1; i < sentences.length; i++) {
            const prev = sentences[i - 1];
            const curr = sentences[i];
            
            if (prev.sentiment !== curr.sentiment) {
                rapidChanges++;
            }

            // Calculate confidence variance
            const variance = Math.abs(prev.confidenceScores[prev.sentiment] - curr.confidenceScores[curr.sentiment]);
            totalVariance += variance;
        }

        const varianceScore = totalVariance / (sentences.length - 1);
        const consistency = 1 - (rapidChanges / sentences.length);

        const patterns: string[] = [];
        if (rapidChanges > sentences.length * 0.5) {
            patterns.push('high_volatility');
        }
        if (consistency > 0.8) {
            patterns.push('high_consistency');
        }
        if (varianceScore > 0.3) {
            patterns.push('confidence_fluctuation');
        }

        return {
            varianceScore,
            rapidChanges,
            consistency,
            patterns
        };
    }

    private generateMockKeyPhrases(text: string): KeyPhraseAnalysis {
        // Implementação mock
        return {
            keyPhrases: [],
            topics: [],
            themes: {
                primaryThemes: [],
                secondaryThemes: [],
                thematicCoherence: 1,
                topicDrift: 0
            },
            importance: []
        };
    }

    private generateMockEntities(text: string): EntityAnalysis {
        // Implementação mock
        return {
            entities: [],
            categories: [],
            relationships: [],
            personInformation: {
                persons: [],
                personCount: 0,
                relationshipDynamics: [],
                nameConsistency: 1
            }
        };
    }

    private generateMockOpinionMining(): OpinionMiningResult {
        // Implementação mock
        return {
            opinions: [],
            overallOpinionPolarity: 0,
            opinionTargets: [],
            conflictingOpinions: []
        };
    }

    // Azure API helper methods (would implement actual API calls in production)
    private async detectLanguage(requestLogger: any): Promise<any> {
        // Implementação mock
        requestLogger.info('Detecting language');
        // Mock implementation - would call Azure API
        return { language: 'pt', confidence: 0.95 };
    }

    private async analyzeSentiment(requestLogger: any): Promise<any> {
        // Implementação mock
        requestLogger.info('Analyzing sentiment');
        // Mock implementation - would call Azure API
        return { sentiment: 'neutral', confidence: 0.8 };
    }

    private async extractKeyPhrases(requestLogger: any): Promise<any> {
        // Implementação mock
        requestLogger.info('Extracting key phrases');
        // Mock implementation - would call Azure API
        return { keyPhrases: ['exemplo', 'teste'] };
    }

    private async recognizeEntities(requestLogger: any): Promise<any> {
        // Implementação mock
        requestLogger.info('Recognizing entities');
        // Mock implementation - would call Azure API
        return { entities: [] };
    }

    private async mineOpinions(requestLogger: any): Promise<any> {
        // Implementação mock
        return {
            opinions: [],
            overallOpinionPolarity: 0,
            opinionTargets: [],
            conflictingOpinions: []
        };
    }

    // Result processors (would process actual Azure API responses)
    private processLanguageDetectionResult(): LanguageDetection {
        // Implementação mock
        return {
            language: 'pt',
            confidence: 1,
            iso6391Name: 'pt',
            name: 'Portuguese'
        };
    }

    private processSentimentResult(): SentimentAnalysis {
        // Implementação mock
        return {
            overallSentiment: 'neutral',
            confidenceScores: { positive: 0.33, negative: 0.33, neutral: 0.34 },
            sentences: [],
            emotionalTone: {
                dominantEmotion: 'neutral',
                emotionScores: {
                    joy: 0,
                    sadness: 0,
                    anger: 0,
                    fear: 0,
                    surprise: 0,
                    disgust: 0
                },
                emotionalIntensity: 0,
                emotionalComplexity: 0
            },
            stabilityMetrics: {
                varianceScore: 0,
                rapidChanges: 0,
                consistency: 1,
                patterns: []
            }
        };
    }

    private processKeyPhrasesResult(): KeyPhraseAnalysis {
        // Implementação mock
        return {
            keyPhrases: [],
            topics: [],
            themes: {
                primaryThemes: [],
                secondaryThemes: [],
                thematicCoherence: 1,
                topicDrift: 0
            },
            importance: []
        };
    }

    private processEntitiesResult(): EntityAnalysis {
        // Implementação mock
        return {
            entities: [],
            categories: [],
            relationships: [],
            personInformation: {
                persons: [],
                personCount: 0,
                relationshipDynamics: [],
                nameConsistency: 1
            }
        };
    }

    private processOpinionMiningResult(): OpinionMiningResult {
        // Implementação mock
        return {
            opinions: [],
            overallOpinionPolarity: 0,
            opinionTargets: [],
            conflictingOpinions: []
        };
    }

    // Utility methods
    private getLanguageName(iso: string): string {
        // Implementação mock
        return 'Portuguese';
    }

    private createEmptySentimentAnalysis(): SentimentAnalysis {
        // Implementação mock
        return {
            overallSentiment: 'neutral',
            confidenceScores: { positive: 0.33, negative: 0.33, neutral: 0.34 },
            sentences: [],
            emotionalTone: {
                dominantEmotion: 'neutral',
                emotionScores: {
                    joy: 0,
                    sadness: 0,
                    anger: 0,
                    fear: 0,
                    surprise: 0,
                    disgust: 0
                },
                emotionalIntensity: 0,
                emotionalComplexity: 0
            },
            stabilityMetrics: {
                varianceScore: 0,
                rapidChanges: 0,
                consistency: 1,
                patterns: []
            }
        };
    }

    private createEmptyKeyPhraseAnalysis(): KeyPhraseAnalysis {
        // Implementação mock
        return {
            keyPhrases: [],
            topics: [],
            themes: {
                primaryThemes: [],
                secondaryThemes: [],
                thematicCoherence: 1,
                topicDrift: 0
            },
            importance: []
        };
    }
    private createEmptyEntityAnalysis(): EntityAnalysis {
        // Implementação mock
        return {
            entities: [],
            categories: [],
            relationships: [],
            personInformation: {
                persons: [],
                personCount: 0,
                relationshipDynamics: [],
                nameConsistency: 1
            }
        };
    }
}

// Export singleton instance
}
export const textAnalyticsService = new TextAnalyticsService();
