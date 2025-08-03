import { LieDetectionResult } from './lieDetectionService';
export interface TextAnalyticsRequest {
    text: string;
    requestId: string;
    language?: string;
    analysisOptions?: TextAnalysisOptions;
}
export interface TextAnalysisOptions {
    enableSentimentAnalysis?: boolean;
    enableKeyPhraseExtraction?: boolean;
    enableEntityRecognition?: boolean;
    enableLanguageDetection?: boolean;
    includeOpinionMining?: boolean;
    customModel?: string;
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
    error?: string;
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
    overallTruthfulness: number;
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
export declare class TextAnalyticsService {
    private readonly endpoint;
    private readonly useMockData;
    constructor();
    /**
     * Perform comprehensive text analysis
     */
    analyzeText(request: TextAnalyticsRequest): Promise<TextAnalyticsResult>;
    /**
     * Analyze text using Azure Text Analytics API
     */
    private analyzeAzureText;
    /**
     * Analyze text using mock data for development
     */
    private analyzeMockText;
    private generateMockSentiment;
    private generateMockSentenceSentiments;
}
//# sourceMappingURL=textAnalyticsService.d.ts.map