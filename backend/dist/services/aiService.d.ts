/**
 * Azure AI Services integration for speech processing and lie detection
 * Implements defensive patterns with comprehensive error handling
 */
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface SpeechRecognitionResult {
    recognizedText: string;
    confidence: number;
    language: string;
    duration: number;
    segments?: SpeechSegment[];
}
export interface SpeechSegment {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
}
export interface SentimentAnalysisResult {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    sentimentScores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    sentences?: SentenceSentiment[];
}
export interface SentenceSentiment {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    offset: number;
    length: number;
}
export interface LieDetectionResult {
    lieDetectionScore: number;
    confidence: number;
    indicators: LieIndicator[];
    analysis: {
        linguisticFactors: LinguisticAnalysis;
        emotionalFactors: EmotionalAnalysis;
        consistencyFactors: ConsistencyAnalysis;
    };
}
export interface LieIndicator {
    type: 'linguistic' | 'emotional' | 'consistency' | 'temporal';
    indicator: string;
    strength: number;
    description: string;
}
export interface LinguisticAnalysis {
    hesitationMarkers: number;
    fillerWords: number;
    complexityScore: number;
    certaintyIndicators: number;
}
export interface EmotionalAnalysis {
    stressIndicators: number;
    anxietyMarkers: number;
    emotionalVariability: number;
}
export interface ConsistencyAnalysis {
    internalConsistency: number;
    temporalConsistency: number;
    logicalCoherence: number;
}
export interface AIProcessingContext {
    audioId: string;
    requestId: string;
    language?: string;
    processingOptions?: ProcessingOptions;
}
export interface ProcessingOptions {
    enableSentimentAnalysis: boolean;
    enableLieDetection: boolean;
    detailedAnalysis: boolean;
    language?: string;
}
/**
 * Azure AI Service for comprehensive audio analysis
 */
export declare class AzureAIService {
    private subscriptionKey;
    private region;
    private endpoint;
    constructor();
    /**
     * Comprehensive audio analysis pipeline
     */
    analyzeAudio(audioBuffer: Buffer, context: AIProcessingContext): Promise<ServiceResult<{
        speechRecognition: SpeechRecognitionResult;
        sentimentAnalysis?: SentimentAnalysisResult;
        lieDetection?: LieDetectionResult;
    }>>;
    /**
     * Speech recognition using Azure Speech Services
     */
    private recognizeSpeech;
    /**
     * Sentiment analysis using Azure Text Analytics
     */
    private analyzeSentiment;
    /**
     * Lie detection using advanced linguistic and emotional analysis
     */
    private detectLies;
    private analyzeLinguisticPatterns;
    private analyzeEmotionalPatterns;
    private analyzeConsistency;
    private calculateLieScore;
    private identifyLieIndicators;
    private calculateVariance;
    private validateConfiguration;
}
export declare const azureAIService: AzureAIService;
//# sourceMappingURL=aiService.d.ts.map