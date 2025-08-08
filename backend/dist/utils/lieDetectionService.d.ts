/**
 * Serviço de Detecção de Mentiras - Core do App "Quem Mente Menos?"
 * Implementa algoritmo defensivo de análise com múltiplas camadas
 */
export interface LieDetectionInput {
    transcription: {
        text: string;
        words: Array<{
            text: string;
            start: number;
            end: number;
            confidence: number;
        }>;
        language: string;
    };
    vocalAnalysis: {
        pitchMean: number;
        pitchStd: number;
        energyMean: number;
        energyStd: number;
        speakingRate: number;
        pauseRatio: number;
    };
    sentiment: {
        positive: number;
        negative: number;
        neutral: number;
        intensity: number;
    };
}
export interface LieDetectionResult {
    lieScore: number;
    confidence: number;
    classification: 'truth' | 'lie' | 'uncertain';
    explanation: string;
    keyIndicators: string[];
    suggestions: string[];
    details: {
        linguisticScore: number;
        vocalScore: number;
        sentimentScore: number;
        consistencyScore: number;
    };
}
export declare class LieDetectionService {
    private readonly weights;
    private readonly thresholds;
    private circuitBreaker;
    private retryPolicy;
    constructor();
    detectLie(input: LieDetectionInput): Promise<LieDetectionResult>;
    private validateInput;
    private analyzeLinguisticPatterns;
    private analyzeVocalPatterns;
    private analyzeSentiment;
    private analyzeConsistency;
    private calculateFinalScore;
    private calculateConfidence;
    private classify;
    private generateExplanation;
    private generateSuggestions;
    private countHesitations;
    private countFillerWords;
    private countNegations;
    private analyzeComplexity;
    private detectTenseChanges;
    private detectDistancing;
    private checkTemporalConsistency;
    private findContradictions;
}
export declare const lieDetectionService: LieDetectionService;
//# sourceMappingURL=lieDetectionService.d.ts.map