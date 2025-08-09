// Types for comprehensive analysis service

export interface TextAnalyticsRequest {
  text: string;
  requestId: string;
  options?: {
    enableSentiment?: boolean;
    enableKeyPhrases?: boolean;
    enableEntities?: boolean;
    enableLanguageDetection?: boolean;
    enablePii?: boolean;
  };
}

export interface ComprehensiveTextAnalysis {
  textAnalysis: any;
  emotionalAnalysis: any;
  linguisticAnalysis: any;
  confidenceScore: number;
  processingTime: number;
}

export interface CrossAnalysisInsights {
  conflicts: ConflictingSignal[];
  reinforcements: ReinforcingPattern[];
  overallCoherence: number;
  analysisQuality: number;
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
}

export interface FinalAssessment {
  overallScore: number;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AnalysisWeights {
  sentiment: number;
  emotion: number;
  linguistic: number;
  context: number;
}
