/**
 * Serviço de Text Analytics para "Quem Mente Menos?"
 * Análise defensiva de sentimento e detecção de padrões linguísticos
 */
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
export declare class TextAnalyticsService {
    private client;
    private circuitBreaker;
    private retryPolicy;
    constructor();
    analyzeText(text: string, language?: string): Promise<TextAnalysisResult>;
    private analyzeSentiment;
    private extractKeyPhrases;
    private recognizeEntities;
    private detectLanguage;
    private detectPII;
    private validateInput;
    private extractResult;
    private getDefaultSentiment;
    private getFallbackAnalysis;
    private extractEmotions;
}
export declare const textAnalyticsService: TextAnalyticsService;
//# sourceMappingURL=textAnalyticsService.d.ts.map