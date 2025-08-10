// Types for comprehensive analysis service

export interface TextAnalyticsRequest {
  text: string;
  requestId: string;
  language?: string;
  options?: {
    enableSentiment?: boolean;
    enableKeyPhrases?: boolean;
    enableEntities?: boolean;
    enableLanguageDetection?: boolean;
    enablePii?: boolean;
  };
}

export interface ComprehensiveTextAnalysis {
  textAnalysis: unknown;
  textAnalytics?: unknown;  
  lieDetection?: unknown;
  emotionalAnalysis: unknown;
  linguisticAnalysis: unknown;
  confidenceScore: number;
  processingTime: number;
  finalAssessment?: FinalAssessment;
  crossAnalysis?: CrossAnalysisInsights;
}

export interface CrossAnalysisInsights {
  conflicts: ConflictingSignal[];
  conflictingSignals: ConflictingSignal[];
  reinforcements: ReinforcingPattern[];
  reinforcingPatterns: ReinforcingPattern[];
  overallCoherence: number;
  analysisQuality: number;
  emotionalConsistency: number;
  linguisticAlignment: number;
  confidenceAlignment: number;
  sentimentLieCorrelation: number;
}

export interface ConflictingSignal {
  type: string;
  description: string;
  severity: number;
  sources: string[];
}

export interface ReinforcingPattern {
  type: string;
  description: string;
  strength: number;
  sources: string[];
  confidence?: number;
}

export interface FinalAssessment {
  overallScore: number;
  overallTruthfulness: number;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  keyFindings: string[];
  primaryConcerns: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisWeights {
  sentiment: number;
  emotion: number;
  linguistic: number;
  context: number;
  speechRecognition?: number;
}
