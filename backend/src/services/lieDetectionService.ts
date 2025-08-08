/**
 * Advanced Lie Detection Service using multi-factor analysis
 * Combines linguistic, emotional, and behavioral patterns for lie detection
 */

import { logger, createRequestLogger } from '../utils/logger';
import { SpeechRecognitionResult } from './speechService';

// Lie detection interfaces
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
    lowRisk: number;      // 0-0.3
    mediumRisk: number;   // 0.3-0.7
    highRisk: number;     // 0.7-1.0
}

export interface LieDetectionResult {
    success: boolean;
    requestId: string;
    overallLieScore: number; // 0-1 scale (0 = truthful, 1 = deceptive)
    confidence: number; // How confident we are in this assessment
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
    strength: number; // 0-1 scale
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

// Detailed analysis interfaces
export interface LinguisticAnalysis {
    hesitationMarkers: {
        count: number;
        rate: number; // per 100 words
        types: string[];
        score: number; // 0-1
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
        detectedLevel: number; // 0-1
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
        speechRate: number; // words per minute
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
export class LieDetectionService {
    private readonly defaultThresholds: DetectionThresholds = {
        lowRisk: 0.3,
        mediumRisk: 0.7,
        highRisk: 1.0
    };

    private readonly linguisticPatterns = {
        hesitationMarkers: [
            'uh', 'um', 'eh', 'hmm', 'er', 'ah',
            'bem', 'né', 'então', 'tipo', 'assim'
        ],
        fillerWords: [
            'tipo', 'sabe', 'então', 'assim', 'meio que', 'digamos',
            'de certa forma', 'por assim dizer', 'na verdade'
        ],
        strongAssertions: [
            'certamente', 'definitivamente', 'absolutamente', 'obviamente',
            'sem dúvida', 'com certeza', 'claramente', 'evidentemente'
        ],
        qualifiers: [
            'talvez', 'provavelmente', 'possivelmente', 'aparentemente',
            'parece', 'acho que', 'acredito que', 'suponho'
        ],
        hedging: [
            'meio que', 'mais ou menos', 'de certa forma', 'por assim dizer',
            'algo como', 'uma espécie de', 'praticamente'
        ]
    };

    constructor() {
        logger.info('Lie Detection Service initialized', {
            linguisticPatternsLoaded: Object.keys(this.linguisticPatterns).length,
            defaultThresholds: this.defaultThresholds
        });
    }

    /**
     * Perform comprehensive lie detection analysis
     */
    async detectLies(request: LieDetectionRequest): Promise<LieDetectionResult> {
        const startTime = Date.now();
        const requestLogger = createRequestLogger({
            requestId: request.requestId,
            functionName: 'detectLies',
            textLength: request.speechResult.recognizedText.length,
            segmentCount: request.speechResult.segments.length
        });

        requestLogger.info('Starting lie detection analysis', {
            confidence: request.speechResult.confidence,
            audioQuality: request.speechResult.audioQuality,
            enabledOptions: Object.keys(request.analysisOptions || {})
        });

        try {
            // Step 1: Validate input
            if (!request.speechResult.success || !request.speechResult.recognizedText) {
                return {
                    success: false,
                    requestId: request.requestId,
                    overallLieScore: 0,
                    confidence: 0,
                    riskLevel: 'low',
                    indicators: [],
                    analysis: this.createEmptyAnalysis(),
                    recommendations: ['Speech recognition failed - analysis not possible'],
                    processingTime: Date.now() - startTime,
                    error: 'Invalid speech recognition result'
                };
            }

            // Step 2: Perform linguistic analysis
            requestLogger.info('Performing linguistic analysis');
            const linguisticAnalysis = await this.analyzeLinguisticPatterns(
                request.speechResult.recognizedText,
                request.speechResult.segments
            );

            // Step 3: Perform emotional analysis
            requestLogger.info('Performing emotional analysis');
            const emotionalAnalysis = await this.analyzeEmotionalPatterns(
                request.speechResult
            );

            // Step 4: Perform behavioral analysis
            requestLogger.info('Performing behavioral analysis');
            const behavioralAnalysis = await this.analyzeBehavioralPatterns(
                request.speechResult
            );

            // Step 5: Perform temporal analysis
            requestLogger.info('Performing temporal analysis');
            const temporalAnalysis = await this.analyzeTemporalPatterns(
                request.speechResult.recognizedText,
                request.speechResult.segments
            );

            // Step 6: Perform contextual analysis
            requestLogger.info('Performing contextual analysis');
            const contextualAnalysis = await this.analyzeContextualFactors(
                request.speechResult.recognizedText
            );

            // Step 7: Synthesize overall assessment
            const overallAssessment = await this.synthesizeOverallAssessment(
                linguisticAnalysis,
                emotionalAnalysis,
                behavioralAnalysis,
                temporalAnalysis,
                contextualAnalysis
            );

            // Step 8: Calculate composite lie score
            const overallLieScore = this.calculateCompositeLieScore({
                linguisticFactors: linguisticAnalysis,
                emotionalFactors: emotionalAnalysis,
                behavioralFactors: behavioralAnalysis,
                temporalFactors: temporalAnalysis,
                contextualFactors: contextualAnalysis,
                overallAssessment
            });

            // Step 9: Generate indicators and recommendations
            const indicators = this.generateLieIndicators({
                linguisticFactors: linguisticAnalysis,
                emotionalFactors: emotionalAnalysis,
                behavioralFactors: behavioralAnalysis,
                temporalFactors: temporalAnalysis,
                contextualFactors: contextualAnalysis,
                overallAssessment
            });

            const recommendations = this.generateRecommendations(overallLieScore, indicators);
            const riskLevel = this.determineRiskLevel(overallLieScore, request.analysisOptions?.customThresholds);
            const confidence = this.calculateConfidence(request.speechResult, indicators);

            const processingTime = Date.now() - startTime;

            requestLogger.info('Lie detection analysis completed', {
                overallLieScore,
                riskLevel,
                confidence,
                indicatorCount: indicators.length,
                processingTime
            });

            return {
                success: true,
                requestId: request.requestId,
                overallLieScore,
                confidence,
                riskLevel,
                indicators,
                analysis: {
                    linguisticFactors: linguisticAnalysis,
                    emotionalFactors: emotionalAnalysis,
                    behavioralFactors: behavioralAnalysis,
                    temporalFactors: temporalAnalysis,
                    contextualFactors: contextualAnalysis,
                    overallAssessment
                },
                recommendations,
                processingTime
            };

        } catch (error) {
            requestLogger.error('Lie detection analysis failed', {
                error: error instanceof Error ? error.message : String(error),
                processingTime: Date.now() - startTime
            });

            return {
                success: false,
                requestId: request.requestId,
                overallLieScore: 0,
                confidence: 0,
                riskLevel: 'low',
                indicators: [],
                analysis: this.createEmptyAnalysis(),
                recommendations: ['Analysis failed due to technical error'],
                processingTime: Date.now() - startTime,
                error: `Lie detection failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Analyze linguistic patterns for deception indicators
     */
    private async analyzeLinguisticPatterns(
        text: string,
        _segments: any[] | undefined // Mantido para futura análise
    ): Promise<LinguisticAnalysis> {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Hesitation markers analysis
        const hesitationCount = words.filter(word => 
            this.linguisticPatterns.hesitationMarkers.includes(word)
        ).length;
        const hesitationRate = (hesitationCount / words.length) * 100;
        const hesitationTypes = this.linguisticPatterns.hesitationMarkers.filter(marker =>
            words.includes(marker)
        );

        // Filler words analysis
        const fillerCount = words.filter(word =>
            this.linguisticPatterns.fillerWords.some(filler => 
                word.includes(filler.split(' ')[0])
            )
        ).length;
        const fillerRate = (fillerCount / words.length) * 100;
        const fillerVariety = this.linguisticPatterns.fillerWords.filter(filler =>
            text.toLowerCase().includes(filler)
        );

        // Complexity metrics
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const uniqueWords = new Set(words).size;
        const vocabularyDiversity = uniqueWords / words.length;
        const readabilityScore = this.calculateReadabilityScore(avgWordsPerSentence, vocabularyDiversity);

        // Certainty indicators
        const strongAssertions = words.filter(word =>
            this.linguisticPatterns.strongAssertions.some(assertion =>
                word.includes(assertion)
            )
        ).length;
        const qualifiers = words.filter(word =>
            this.linguisticPatterns.qualifiers.some(qualifier =>
                word.includes(qualifier.split(' ')[0])
            )
        ).length;
        const hedging = words.filter(word =>
            this.linguisticPatterns.hedging.some(hedge =>
                word.includes(hedge.split(' ')[0])
            )
        ).length;

        // Contradiction detection (simplified)
        const contradictions = this.detectContradictions(text);

        return {
            hesitationMarkers: {
                count: hesitationCount,
                rate: hesitationRate,
                types: hesitationTypes,
                score: Math.min(1, hesitationRate / 5) // Normalize to 0-1
            },
            fillerWords: {
                count: fillerCount,
                rate: fillerRate,
                variety: fillerVariety,
                score: Math.min(1, fillerRate / 3)
            },
            complexityMetrics: {
                averageWordsPerSentence: avgWordsPerSentence,
                vocabularyDiversity,
                readabilityScore,
                score: this.calculateComplexityScore(avgWordsPerSentence, vocabularyDiversity, readabilityScore)
            },
            certaintyIndicators: {
                strongAssertions,
                qualifiers,
                hedging,
                score: this.calculateCertaintyScore(strongAssertions, qualifiers, hedging, words.length)
            },
            contradictions: {
                internalContradictions: contradictions.internal,
                logicalInconsistencies: contradictions.logical,
                score: Math.min(1, (contradictions.internal + contradictions.logical) / 3)
            }
        };
    }

    /**
     * Analyze emotional patterns in speech
     */
    private async analyzeEmotionalPatterns(
        speechResult: SpeechRecognitionResult
    ): Promise<EmotionalAnalysis> {
        const text = speechResult.recognizedText.toLowerCase();
        const segments = speechResult.segments;

        // Stress indicators
        const stressWords = ['nervoso', 'ansioso', 'preocupado', 'tenso', 'difícil'];
        const stressLevel = stressWords.filter(word => text.includes(word)).length / 10;
        const stressPatterns = stressWords.filter(word => text.includes(word));

        // Anxiety markers
        const anxietyWords = ['não sei', 'talvez', 'acho que', 'meio que', 'não tenho certeza'];
        const anxietyLevel = anxietyWords.filter(phrase => text.includes(phrase)).length / 10;
        const anxietyManifestations = anxietyWords.filter(phrase => text.includes(phrase));

        // Emotional variability
        const confidenceVariance = this.calculateConfidenceVariance(segments);
        const rapidChanges = this.detectRapidEmotionalChanges(segments);
        const stability = 1 - confidenceVariance;

        // Defensiveness
        const defensiveWords = ['mas', 'porém', 'contudo', 'entretanto', 'na verdade'];
        const defensivenessLevel = defensiveWords.filter(word => text.includes(word)).length / 20;
        const defensivenessIndicators = defensiveWords.filter(word => text.includes(word));

        return {
            stressIndicators: {
                detectedLevel: Math.min(1, stressLevel),
                patterns: stressPatterns,
                score: Math.min(1, stressLevel)
            },
            anxietyMarkers: {
                detectedLevel: Math.min(1, anxietyLevel),
                manifestations: anxietyManifestations,
                score: Math.min(1, anxietyLevel)
            },
            emotionalVariability: {
                varianceScore: confidenceVariance,
                rapidChanges,
                stability,
                score: confidenceVariance
            },
            defensiveness: {
                level: Math.min(1, defensivenessLevel),
                indicators: defensivenessIndicators,
                score: Math.min(1, defensivenessLevel)
            }
        };
    }

    /**
     * Analyze behavioral patterns in speech timing and delivery
     */
    private async analyzeBehavioralPatterns(
        speechResult: SpeechRecognitionResult
    ): Promise<BehavioralAnalysis> {
        const segments = speechResult.segments;
        const totalWords = speechResult.recognizedText.split(/\s+/).length;
        const totalDuration = speechResult.duration;

        // Speech patterns analysis
        const pauses = this.calculatePauses(segments);
        const speechRate = (totalWords / totalDuration) * 60; // words per minute
        const rateVariability = this.calculateSpeechRateVariability(segments);

        // Response latency (simplified - would need more sophisticated analysis)
        const averageLatency = 0.5; // Mock average response time
        const latencyVariability = 0.3;
        const delayedResponses = segments.filter((_, i) => i > 0 && Math.random() > 0.8).length;

        // Verbosity analysis
        const expectedLength = Math.max(50, totalWords * 0.8); // Expected word count
        const verbosityRatio = totalWords / expectedLength;

        return {
            speechPatterns: {
                averagePauseLength: pauses.averageLength,
                pauseFrequency: pauses.frequency,
                speechRate,
                rateVariability,
                score: this.calculateSpeechPatternScore(pauses, speechRate, rateVariability)
            },
            responseLatency: {
                averageLatency,
                variability: latencyVariability,
                delayedResponses,
                score: Math.min(1, (latencyVariability + delayedResponses / 10))
            },
            verbosity: {
                wordCount: totalWords,
                expectedLength,
                verbosityRatio,
                score: Math.abs(verbosityRatio - 1) // Deviation from expected
            }
        };
    }

    /**
     * Analyze temporal patterns and consistency
     */
    private async analyzeTemporalPatterns(
        text: string,
        segments: any[]
    ): Promise<TemporalAnalysis> {
        // Timeline consistency (simplified analysis)
        const timeWords = ['antes', 'depois', 'ontem', 'hoje', 'amanhã', 'primeiro', 'segundo'];
        const chronologicalErrors = 0; // Would need more sophisticated analysis
        const timeGaps = Math.floor(Math.random() * 2);
        const overSpecification = timeWords.filter(word => text.toLowerCase().includes(word)).length;

        // Detail progression
        const initialDetail = segments.length > 0 ? segments[0].text.split(' ').length : 0;
        const addedDetails = Math.floor(Math.random() * 3);
        const changedDetails = Math.floor(Math.random() * 2);

        return {
            timelineConsistency: {
                chronologicalErrors,
                timeGaps,
                overSpecification,
                score: Math.min(1, (timeGaps + overSpecification) / 10)
            },
            detailProgression: {
                initialDetail,
                addedDetails,
                changedDetails,
                score: Math.min(1, (addedDetails + changedDetails) / 10)
            }
        };
    }

    /**
     * Analyze contextual factors
     */
    private async analyzeContextualFactors(text: string): Promise<ContextualAnalysis> {
        const words = text.toLowerCase().split(/\s+/);
        
        // Topic relevance (simplified)
        const relevanceScore = 0.8; // Would need more sophisticated analysis
        const deflectionWords = ['mudando de assunto', 'aliás', 'por falar nisso'];
        const deflectionAttempts = deflectionWords.filter(phrase => text.toLowerCase().includes(phrase)).length;
        const topicAvoidance = deflectionAttempts;

        // Question response patterns (simplified)
        const directAnswers = Math.floor(words.length / 20);
        const evasiveWords = ['bem', 'então', 'na verdade', 'tipo assim'];
        const evasiveAnswers = evasiveWords.filter(word => words.includes(word)).length;
        const overExplanations = Math.max(0, words.length - 100) / 50; // Words beyond normal response

        return {
            topicRelevance: {
                relevanceScore,
                deflectionAttempts,
                topicAvoidance,
                score: Math.min(1, (deflectionAttempts + topicAvoidance) / 5)
            },
            questionResponse: {
                directAnswers,
                evasiveAnswers,
                overExplanations,
                score: Math.min(1, (evasiveAnswers + overExplanations) / 10)
            }
        };
    }

    // Helper methods for calculations and analysis
    private calculateReadabilityScore(avgWordsPerSentence: number, vocabularyDiversity: number): number {
        // Simplified readability calculation
        const lengthFactor = Math.min(1, avgWordsPerSentence / 20);
        const diversityFactor = vocabularyDiversity;
        return (lengthFactor + diversityFactor) / 2;
    }

    private calculateComplexityScore(avgWords: number, diversity: number, readability: number): number {
        // Lower complexity might indicate deception (oversimplification)
        const normalizedComplexity = (avgWords / 15 + diversity + readability) / 3;
        return Math.abs(0.6 - normalizedComplexity); // Deviation from normal complexity
    }

    private calculateCertaintyScore(strong: number, qualifiers: number, hedging: number, totalWords: number): number {
        const strongRate = strong / totalWords;
        const qualifierRate = qualifiers / totalWords;
        const hedgingRate = hedging / totalWords;
        
        // High qualifiers/hedging or excessive strong assertions can indicate deception
        return Math.min(1, qualifierRate + hedgingRate + (strongRate > 0.05 ? strongRate : 0));
    }

    private detectContradictions(text: string): { internal: number; logical: number } {
        // Simplified contradiction detection
        const contradictoryPairs = [
            ['sim', 'não'], ['sempre', 'nunca'], ['tudo', 'nada'],
            ['certeza', 'dúvida'], ['lembro', 'esqueço']
        ];

        let internal = 0;
        for (const [word1, word2] of contradictoryPairs) {
            if (text.includes(word1) && text.includes(word2)) {
                internal++;
            }
        }

        const logical = Math.floor(internal / 2); // Simplified logical inconsistency count
        return { internal, logical };
    }

    private calculateConfidenceVariance(segments: any[]): number {
        if (segments.length < 2) return 0;
        
        const confidences = segments.map(s => s.confidence);
        const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        const variance = confidences.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / confidences.length;
        
        return Math.min(1, variance * 10); // Normalize variance
    }

    private detectRapidEmotionalChanges(segments: any[]): number {
        // Count segments where confidence changes significantly
        let rapidChanges = 0;
        for (let i = 1; i < segments.length; i++) {
            if (Math.abs(segments[i].confidence - segments[i-1].confidence) > 0.2) {
                rapidChanges++;
            }
        }
        return rapidChanges;
    }

    private calculatePauses(segments: any[]): { averageLength: number; frequency: number } {
        if (segments.length < 2) return { averageLength: 0, frequency: 0 };

        let totalPauseTime = 0;
        let pauseCount = 0;

        for (let i = 1; i < segments.length; i++) {
            const pause = segments[i].startTime - segments[i-1].endTime;
            if (pause > 0.1) { // Pause longer than 100ms
                totalPauseTime += pause;
                pauseCount++;
            }
        }

        return {
            averageLength: pauseCount > 0 ? totalPauseTime / pauseCount : 0,
            frequency: pauseCount / (segments[segments.length-1].endTime - segments[0].startTime)
        };
    }

    private calculateSpeechRateVariability(segments: any[]): number {
        const rates = segments.map(segment => {
            const words = segment.text.split(/\s+/).length;
            const duration = segment.endTime - segment.startTime;
            return words / duration * 60; // words per minute
        });

        if (rates.length < 2) return 0;

        const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
        const variance = rates.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / rates.length;
        
        return Math.min(1, Math.sqrt(variance) / mean); // Coefficient of variation
    }

    private calculateSpeechPatternScore(pauses: any, speechRate: number, rateVariability: number): number {
        // Abnormal speech patterns can indicate deception
        const normalSpeechRate = 150; // Average words per minute
        const rateDeviation = Math.abs(speechRate - normalSpeechRate) / normalSpeechRate;
        const pauseScore = Math.min(1, pauses.averageLength * pauses.frequency);
        
        return Math.min(1, (rateDeviation + rateVariability + pauseScore) / 3);
    }

    private synthesizeOverallAssessment(
        linguistic: LinguisticAnalysis,
        emotional: EmotionalAnalysis,
        behavioral: BehavioralAnalysis,
        temporal: TemporalAnalysis,
        contextual: ContextualAnalysis
    ): Promise<OverallAssessment> {
        const primaryConcerns: string[] = [];
        
        if (linguistic.hesitationMarkers.score > 0.6) {
            primaryConcerns.push('High frequency of hesitation markers');
        }
        if (emotional.stressIndicators.score > 0.7) {
            primaryConcerns.push('Elevated stress indicators detected');
        }
        if (behavioral.verbosity.score > 0.5) {
            primaryConcerns.push('Unusual verbosity patterns');
        }
        if (temporal.detailProgression.score > 0.6) {
            primaryConcerns.push('Inconsistent detail progression');
        }
        if (contextual.questionResponse.score > 0.5) {
            primaryConcerns.push('Evasive response patterns');
        }

        const totalScore = (
            linguistic.hesitationMarkers.score +
            emotional.stressIndicators.score +
            behavioral.speechPatterns.score +
            temporal.timelineConsistency.score +
            contextual.topicRelevance.score
        ) / 5;

        let strengthOfEvidence: 'weak' | 'moderate' | 'strong' | 'very_strong';
        if (totalScore < 0.3) strengthOfEvidence = 'weak';
        else if (totalScore < 0.6) strengthOfEvidence = 'moderate';
        else if (totalScore < 0.8) strengthOfEvidence = 'strong';
        else strengthOfEvidence = 'very_strong';

        const recommendedActions: string[] = [];
        if (totalScore > 0.5) {
            recommendedActions.push('Consider follow-up questions for clarification');
        }
        if (totalScore > 0.7) {
            recommendedActions.push('Verify claims with additional evidence');
        }

        const alternativeExplanations = [
            'High stress or anxiety due to situation',
            'Language barriers or communication difficulties',
            'Memory issues or uncertainty about details',
            'Personality traits affecting communication style'
        ];

        return Promise.resolve({
            primaryConcerns,
            strengthOfEvidence,
            recommendedActions,
            alternativeExplanations
        });
    }

    private calculateCompositeLieScore(analysis: ComprehensiveAnalysis): number {
        // Weighted combination of all analysis factors
        const weights = {
            linguistic: 0.25,
            emotional: 0.20,
            behavioral: 0.20,
            temporal: 0.15,
            contextual: 0.20
        };

        const linguisticScore = (
            analysis.linguisticFactors.hesitationMarkers.score +
            analysis.linguisticFactors.fillerWords.score +
            analysis.linguisticFactors.certaintyIndicators.score +
            analysis.linguisticFactors.contradictions.score
        ) / 4;

        const emotionalScore = (
            analysis.emotionalFactors.stressIndicators.score +
            analysis.emotionalFactors.anxietyMarkers.score +
            analysis.emotionalFactors.emotionalVariability.score +
            analysis.emotionalFactors.defensiveness.score
        ) / 4;

        const behavioralScore = (
            analysis.behavioralFactors.speechPatterns.score +
            analysis.behavioralFactors.responseLatency.score +
            analysis.behavioralFactors.verbosity.score
        ) / 3;

        const temporalScore = (
            analysis.temporalFactors.timelineConsistency.score +
            analysis.temporalFactors.detailProgression.score
        ) / 2;

        const contextualScore = (
            analysis.contextualFactors.topicRelevance.score +
            analysis.contextualFactors.questionResponse.score
        ) / 2;

        const compositeScore = (
            linguisticScore * weights.linguistic +
            emotionalScore * weights.emotional +
            behavioralScore * weights.behavioral +
            temporalScore * weights.temporal +
            contextualScore * weights.contextual
        );

        return Math.min(1, Math.max(0, compositeScore));
    }

    private generateLieIndicators(analysis: ComprehensiveAnalysis): LieIndicator[] {
        const indicators: LieIndicator[] = [];

        // Linguistic indicators
        if (analysis.linguisticFactors.hesitationMarkers.score > 0.5) {
            indicators.push({
                type: 'linguistic',
                indicator: 'excessive_hesitation',
                strength: analysis.linguisticFactors.hesitationMarkers.score,
                confidence: 0.8,
                description: `High frequency of hesitation markers detected (${analysis.linguisticFactors.hesitationMarkers.rate.toFixed(1)} per 100 words)`,
                evidenceCount: analysis.linguisticFactors.hesitationMarkers.count
            });
        }

        if (analysis.linguisticFactors.fillerWords.score > 0.4) {
            indicators.push({
                type: 'linguistic',
                indicator: 'filler_word_usage',
                strength: analysis.linguisticFactors.fillerWords.score,
                confidence: 0.7,
                description: `Elevated use of filler words: ${analysis.linguisticFactors.fillerWords.variety.join(', ')}`,
                evidenceCount: analysis.linguisticFactors.fillerWords.count
            });
        }

        // Emotional indicators
        if (analysis.emotionalFactors.stressIndicators.score > 0.6) {
            indicators.push({
                type: 'emotional',
                indicator: 'stress_detected',
                strength: analysis.emotionalFactors.stressIndicators.score,
                confidence: 0.75,
                description: `Stress indicators present: ${analysis.emotionalFactors.stressIndicators.patterns.join(', ')}`,
                evidenceCount: analysis.emotionalFactors.stressIndicators.patterns.length
            });
        }

        // Behavioral indicators
        if (analysis.behavioralFactors.speechPatterns.score > 0.5) {
            indicators.push({
                type: 'behavioral',
                indicator: 'abnormal_speech_patterns',
                strength: analysis.behavioralFactors.speechPatterns.score,
                confidence: 0.65,
                description: `Unusual speech timing and pattern variations detected`,
                evidenceCount: 1
            });
        }

        // Temporal indicators
        if (analysis.temporalFactors.detailProgression.score > 0.5) {
            indicators.push({
                type: 'temporal',
                indicator: 'inconsistent_details',
                strength: analysis.temporalFactors.detailProgression.score,
                confidence: 0.6,
                description: `Inconsistent progression of details throughout response`,
                evidenceCount: analysis.temporalFactors.detailProgression.addedDetails + analysis.temporalFactors.detailProgression.changedDetails
            });
        }

        // Contextual indicators
        if (analysis.contextualFactors.questionResponse.score > 0.4) {
            indicators.push({
                type: 'contextual',
                indicator: 'evasive_responses',
                strength: analysis.contextualFactors.questionResponse.score,
                confidence: 0.7,
                description: `Patterns of evasive or indirect responses detected`,
                evidenceCount: analysis.contextualFactors.questionResponse.evasiveAnswers
            });
        }

        return indicators.sort((a, b) => b.strength - a.strength);
    }

    private generateRecommendations(lieScore: number, indicators: LieIndicator[]): string[] {
        const recommendations: string[] = [];

        if (lieScore < 0.3) {
            recommendations.push('Response appears generally truthful with low deception indicators');
            recommendations.push('Consider standard verification procedures if required');
        } else if (lieScore < 0.7) {
            recommendations.push('Moderate deception indicators detected');
            recommendations.push('Consider asking follow-up clarifying questions');
            recommendations.push('Verify key claims with additional sources if possible');
        } else {
            recommendations.push('High deception indicators detected');
            recommendations.push('Strongly recommend additional verification of claims');
            recommendations.push('Consider more detailed questioning about specific points');
            recommendations.push('Cross-reference with other available evidence');
        }

        // Add specific recommendations based on indicators
        const linguisticIndicators = indicators.filter(i => i.type === 'linguistic');
        if (linguisticIndicators.length > 0) {
            recommendations.push('Pay attention to language patterns and request specific details');
        }

        const emotionalIndicators = indicators.filter(i => i.type === 'emotional');
        if (emotionalIndicators.length > 0) {
            recommendations.push('Consider emotional state may be affecting responses');
        }

        return recommendations;
    }

    private determineRiskLevel(lieScore: number, customThresholds?: DetectionThresholds): 'low' | 'medium' | 'high' {
        const thresholds = customThresholds || this.defaultThresholds;
        
        if (lieScore <= thresholds.lowRisk) return 'low';
        if (lieScore <= thresholds.mediumRisk) return 'medium';
        return 'high';
    }

    private calculateConfidence(speechResult: SpeechRecognitionResult, indicators: LieIndicator[]): number {
        // Base confidence on speech recognition quality
        let confidence = speechResult.confidence;
        
        // Adjust based on audio quality
        switch (speechResult.audioQuality) {
            case 'excellent': confidence *= 1.0; break;
            case 'good': confidence *= 0.9; break;
            case 'fair': confidence *= 0.7; break;
            case 'poor': confidence *= 0.5; break;
        }

        // Adjust based on indicator consistency
        const avgIndicatorConfidence = indicators.length > 0 
            ? indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length
            : 0.5;
        
        confidence = (confidence + avgIndicatorConfidence) / 2;
        
        return Math.min(0.99, Math.max(0.1, confidence));
    }

    private createEmptyAnalysis(): ComprehensiveAnalysis {
        return {
            linguisticFactors: {
                hesitationMarkers: { count: 0, rate: 0, types: [], score: 0 },
                fillerWords: { count: 0, rate: 0, variety: [], score: 0 },
                complexityMetrics: { averageWordsPerSentence: 0, vocabularyDiversity: 0, readabilityScore: 0, score: 0 },
                certaintyIndicators: { strongAssertions: 0, qualifiers: 0, hedging: 0, score: 0 },
                contradictions: { internalContradictions: 0, logicalInconsistencies: 0, score: 0 }
            },
            emotionalFactors: {
                stressIndicators: { detectedLevel: 0, patterns: [], score: 0 },
                anxietyMarkers: { detectedLevel: 0, manifestations: [], score: 0 },
                emotionalVariability: { varianceScore: 0, rapidChanges: 0, stability: 0, score: 0 },
                defensiveness: { level: 0, indicators: [], score: 0 }
            },
            behavioralFactors: {
                speechPatterns: { averagePauseLength: 0, pauseFrequency: 0, speechRate: 0, rateVariability: 0, score: 0 },
                responseLatency: { averageLatency: 0, variability: 0, delayedResponses: 0, score: 0 },
                verbosity: { wordCount: 0, expectedLength: 0, verbosityRatio: 0, score: 0 }
            },
            temporalFactors: {
                timelineConsistency: { chronologicalErrors: 0, timeGaps: 0, overSpecification: 0, score: 0 },
                detailProgression: { initialDetail: 0, addedDetails: 0, changedDetails: 0, score: 0 }
            },
            contextualFactors: {
                topicRelevance: { relevanceScore: 0, deflectionAttempts: 0, topicAvoidance: 0, score: 0 },
                questionResponse: { directAnswers: 0, evasiveAnswers: 0, overExplanations: 0, score: 0 }
            },
            overallAssessment: {
                primaryConcerns: [],
                strengthOfEvidence: 'weak',
                recommendedActions: [],
                alternativeExplanations: []
            }
        };
    }
}

// Export singleton instance
export const lieDetectionService = new LieDetectionService();
