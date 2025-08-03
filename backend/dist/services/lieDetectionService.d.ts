/**
 * Advanced Lie Detection Service using multi-factor analysis
 * Combines linguistic, emotional, and behavioral patterns for lie detection
 */
import { SpeechRecognitionResult } from './speechService';
export interface LieDetectionRequest {
    speechResult: SpeechRecognitionResult;
    requestId: string;
    analysisOptions?: LieDetectionOptions;
}
export interface LieDetectionOptions {
    enableDeepAnalysis?: boolean;
    includeConfidenceFactors?: boolean;
    enableEmotionalAnalysis?: boolean;
    enableBehavioralAnalysis?: boolean;
    customThresholds?: DetectionThresholds;
}
export interface DetectionThresholds {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
}
export interface LieDetectionResult {
    success: boolean;
    requestId: string;
    overallLieScore: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    indicators: LieIndicator[];
    analysis: ComprehensiveAnalysis;
    recommendations: string[];
    processingTime: number;
    error?: string;
}
export interface LieIndicator {
    type: 'linguistic' | 'emotional' | 'behavioral' | 'temporal' | 'contextual';
    indicator: string;
    strength: number;
    confidence: number;
    description: string;
    evidenceCount: number;
}
export interface ComprehensiveAnalysis {
    linguisticFactors: LinguisticAnalysis;
    emotionalFactors: EmotionalAnalysis;
    behavioralFactors: BehavioralAnalysis;
    temporalFactors: TemporalAnalysis;
    contextualFactors: ContextualAnalysis;
    overallAssessment: OverallAssessment;
}
export interface LinguisticAnalysis {
    hesitationMarkers: {
        count: number;
        rate: number;
        types: string[];
        score: number;
    };
    fillerWords: {
        count: number;
        rate: number;
        variety: string[];
        score: number;
    };
    complexityMetrics: {
        averageWordsPerSentence: number;
        vocabularyDiversity: number;
        readabilityScore: number;
        score: number;
    };
    certaintyIndicators: {
        strongAssertions: number;
        qualifiers: number;
        hedging: number;
        score: number;
    };
    contradictions: {
        internalContradictions: number;
        logicalInconsistencies: number;
        score: number;
    };
}
export interface EmotionalAnalysis {
    stressIndicators: {
        detectedLevel: number;
        patterns: string[];
        score: number;
    };
    anxietyMarkers: {
        detectedLevel: number;
        manifestations: string[];
        score: number;
    };
    emotionalVariability: {
        varianceScore: number;
        rapidChanges: number;
        stability: number;
        score: number;
    };
    defensiveness: {
        level: number;
        indicators: string[];
        score: number;
    };
}
export interface BehavioralAnalysis {
    speechPatterns: {
        averagePauseLength: number;
        pauseFrequency: number;
        speechRate: number;
        rateVariability: number;
        score: number;
    };
    responseLatency: {
        averageLatency: number;
        variability: number;
        delayedResponses: number;
        score: number;
    };
    verbosity: {
        wordCount: number;
        expectedLength: number;
        verbosityRatio: number;
        score: number;
    };
}
export interface TemporalAnalysis {
    timelineConsistency: {
        chronologicalErrors: number;
        timeGaps: number;
        overSpecification: number;
        score: number;
    };
    detailProgression: {
        initialDetail: number;
        addedDetails: number;
        changedDetails: number;
        score: number;
    };
}
export interface ContextualAnalysis {
    topicRelevance: {
        relevanceScore: number;
        deflectionAttempts: number;
        topicAvoidance: number;
        score: number;
    };
    questionResponse: {
        directAnswers: number;
        evasiveAnswers: number;
        overExplanations: number;
        score: number;
    };
}
export interface OverallAssessment {
    primaryConcerns: string[];
    strengthOfEvidence: 'weak' | 'moderate' | 'strong' | 'very_strong';
    recommendedActions: string[];
    alternativeExplanations: string[];
}
/**
 * Advanced Lie Detection Service
 */
export declare class LieDetectionService {
    private readonly defaultThresholds;
    private readonly linguisticPatterns;
    constructor();
    /**
     * Perform comprehensive lie detection analysis
     */
    detectLies(request: LieDetectionRequest): Promise<LieDetectionResult>;
    /**
     * Analyze linguistic patterns for deception indicators
     */
    private analyzeLinguisticPatterns;
    /**
     * Analyze emotional patterns in speech
     */
    private analyzeEmotionalPatterns;
    /**
     * Analyze behavioral patterns in speech timing and delivery
     */
    private analyzeBehavioralPatterns;
    /**
     * Analyze temporal patterns and consistency
     */
    private analyzeTemporalPatterns;
    /**
     * Analyze contextual factors
     */
    private analyzeContextualFactors;
    private calculateReadabilityScore;
    private calculateComplexityScore;
    private calculateCertaintyScore;
    private detectContradictions;
    private calculateConfidenceVariance;
    private detectRapidEmotionalChanges;
    private calculatePauses;
    private calculateSpeechRateVariability;
    private calculateSpeechPatternScore;
    private synthesizeOverallAssessment;
    private calculateCompositeLieScore;
    private generateLieIndicators;
    private generateRecommendations;
    private determineRiskLevel;
    private calculateConfidence;
    private createEmptyAnalysis;
}
export declare const lieDetectionService: LieDetectionService;
//# sourceMappingURL=lieDetectionService.d.ts.map