/**
 * Comprehensive AI Analysis Service
 * Orchestrates speech recognition, text analytics, and lie detection for complete analysis
 */
import { ComprehensiveTextAnalysis } from './textAnalyticsService';
export interface ComprehensiveAnalysisRequest {
    audioData: Buffer;
    requestId: string;
    analysisOptions?: ComprehensiveAnalysisOptions;
    metadata?: AnalysisMetadata;
}
export interface ComprehensiveAnalysisOptions {
    enableSpeechRecognition?: boolean;
    enableTextAnalytics?: boolean;
    enableLieDetection?: boolean;
    enableDeepAnalysis?: boolean;
    confidenceThreshold?: number;
    customWeights?: AnalysisWeights;
    reportingLevel?: 'basic' | 'detailed' | 'comprehensive';
}
export interface AnalysisMetadata {
    sessionId?: string;
    participantId?: string;
    contextType?: 'interview' | 'conversation' | 'testimony' | 'other';
    expectedDuration?: number;
    baseline?: BaselineData;
}
export interface BaselineData {
    normalSpeechPattern?: any;
    typicalSentiment?: string;
    personalityProfile?: any;
}
export interface AnalysisWeights {
    speechRecognition: number;
    sentimentAnalysis: number;
    lieDetection: number;
    behavioralAnalysis: number;
    linguisticAnalysis: number;
}
export interface ComprehensiveAnalysisResult {
    success: boolean;
    requestId: string;
    overallScore: OverallScore;
    comprehensiveAnalysis: ComprehensiveTextAnalysis;
    executiveSummary: ExecutiveSummary;
    detailedFindings: DetailedFindings;
    recommendations: Recommendation[];
    qualityMetrics: QualityMetrics;
    processingTime: number;
    error?: string;
}
export interface OverallScore {
    truthfulnessScore: number;
    confidenceLevel: number;
    riskAssessment: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    reliability: 'excellent' | 'good' | 'fair' | 'poor';
    primaryIndicators: string[];
}
export interface ExecutiveSummary {
    keyFindings: string[];
    primaryConcerns: string[];
    strengthsOfTruth: string[];
    criticalRisks: string[];
    overallAssessment: string;
    actionRequired: boolean;
}
export interface DetailedFindings {
    speechAnalysis: SpeechFindings;
    sentimentAnalysis: SentimentFindings;
    behavioralAnalysis: BehavioralFindings;
    linguisticAnalysis: LinguisticFindings;
    temporalAnalysis: TemporalFindings;
    crossCorrelations: CrossCorrelationFindings;
}
export interface SpeechFindings {
    recognitionQuality: string;
    audioQuality: string;
    speechPatterns: string[];
    anomalies: string[];
    confidence: number;
}
export interface SentimentFindings {
    overallSentiment: string;
    emotionalStability: string;
    stressIndicators: string[];
    emotionalAnomalies: string[];
    confidence: number;
}
export interface BehavioralFindings {
    speechTiming: string;
    responsePatterns: string[];
    verbalBehaviors: string[];
    anomalies: string[];
    confidence: number;
}
export interface LinguisticFindings {
    languagePatterns: string[];
    complexityAnalysis: string;
    coherenceMetrics: string[];
    deceptionMarkers: string[];
    confidence: number;
}
export interface TemporalFindings {
    timelineConsistency: string;
    narrativeFlow: string[];
    chronologicalIssues: string[];
    confidence: number;
}
export interface CrossCorrelationFindings {
    alignmentScore: number;
    conflictingSignals: string[];
    reinforcingPatterns: string[];
    overallCoherence: string;
}
export interface Recommendation {
    type: 'immediate' | 'follow_up' | 'verification' | 'investigation';
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
    expectedOutcome: string;
    timeframe?: string;
}
export interface QualityMetrics {
    dataQuality: number;
    analysisReliability: number;
    confidenceDistribution: number[];
    processingEfficiency: number;
    modelPerformance: ModelPerformance;
}
export interface ModelPerformance {
    speechRecognitionAccuracy: number;
    sentimentAnalysisConfidence: number;
    lieDetectionPrecision: number;
    overallModelReliability: number;
}
/**
 * Comprehensive AI Analysis Service
 */
export declare class ComprehensiveAnalysisService {
    private readonly defaultWeights;
    private readonly defaultOptions;
    constructor();
    /**
     * Perform comprehensive analysis of audio input
     */
    analyzeComprehensively(request: ComprehensiveAnalysisRequest): Promise<ComprehensiveAnalysisResult>;
    /**
     * Perform cross-analysis between different AI services
     */
    private performCrossAnalysis;
    /**
     * Calculate cross-analysis insights
     */
    private calculateCrossAnalysisInsights;
    /**
     * Generate final assessment combining all analyses
     */
    private generateFinalAssessment;
    private convertSentimentToScore;
    private calculateCorrelation;
    private calculateFinalConfidence;
    private calculateOverallScore;
    private mapRiskLevel;
    private generateExecutiveSummary;
    private generateDetailedFindings;
    private generateRecommendations;
    private calculateQualityMetrics;
    private createFailureOverallScore;
    private createEmptyComprehensiveAnalysis;
    private createFailureExecutiveSummary;
    private createEmptyDetailedFindings;
    private createFailureRecommendation;
    private createEmptyQualityMetrics;
    private createEmptyTextAnalyticsResult;
    private createEmptyLieDetectionResult;
}
export declare const comprehensiveAnalysisService: ComprehensiveAnalysisService;
//# sourceMappingURL=comprehensiveAnalysisService.d.ts.map