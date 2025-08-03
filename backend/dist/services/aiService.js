"use strict";
/**
 * Azure AI Services integration for speech processing and lie detection
 * Implements defensive patterns with comprehensive error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.azureAIService = exports.AzureAIService = void 0;
const logger_1 = require("../utils/logger");
/**
 * Azure AI Service for comprehensive audio analysis
 */
class AzureAIService {
    constructor() {
        this.subscriptionKey = process.env.AZURE_AI_SUBSCRIPTION_KEY || '';
        this.region = process.env.AZURE_AI_REGION || 'eastus';
        this.endpoint = process.env.AZURE_AI_ENDPOINT || `https://${this.region}.api.cognitive.microsoft.com`;
        this.validateConfiguration();
        logger_1.logger.info('Azure AI Service initialized', {
            region: this.region,
            hasSubscriptionKey: !!this.subscriptionKey
        });
    }
    /**
     * Comprehensive audio analysis pipeline
     */
    async analyzeAudio(audioBuffer, context) {
        var _a, _b;
        logger_1.logger.info('Starting comprehensive audio analysis', {
            audioId: context.audioId,
            audioSize: audioBuffer.length,
            options: context.processingOptions
        });
        try {
            // Step 1: Speech Recognition (always required)
            const speechResult = await this.recognizeSpeech(audioBuffer, context);
            if (!speechResult.success) {
                return {
                    success: false,
                    error: `Speech recognition failed: ${speechResult.error}`
                };
            }
            const results = {
                speechRecognition: speechResult.data
            };
            // Step 2: Sentiment Analysis (if enabled)
            if ((_a = context.processingOptions) === null || _a === void 0 ? void 0 : _a.enableSentimentAnalysis) {
                const sentimentResult = await this.analyzeSentiment(speechResult.data.recognizedText, context);
                if (sentimentResult.success) {
                    results.sentimentAnalysis = sentimentResult.data;
                }
                else {
                    logger_1.logger.warn('Sentiment analysis failed, continuing without it', {
                        audioId: context.audioId,
                        error: sentimentResult.error
                    });
                }
            }
            // Step 3: Lie Detection (if enabled)
            if ((_b = context.processingOptions) === null || _b === void 0 ? void 0 : _b.enableLieDetection) {
                const lieDetectionResult = await this.detectLies(speechResult.data, results.sentimentAnalysis, context);
                if (lieDetectionResult.success) {
                    results.lieDetection = lieDetectionResult.data;
                }
                else {
                    logger_1.logger.warn('Lie detection failed, continuing without it', {
                        audioId: context.audioId,
                        error: lieDetectionResult.error
                    });
                }
            }
            logger_1.logger.info('Audio analysis completed successfully', {
                audioId: context.audioId,
                hasSepeechRecognition: !!results.speechRecognition,
                hasSentimentAnalysis: !!results.sentimentAnalysis,
                hasLieDetection: !!results.lieDetection
            });
            return {
                success: true,
                data: results
            };
        }
        catch (error) {
            logger_1.logger.error('Unexpected error in audio analysis', {
                audioId: context.audioId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                error: `Audio analysis failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Speech recognition using Azure Speech Services
     */
    async recognizeSpeech(audioBuffer, context) {
        logger_1.logger.info('Starting speech recognition', {
            audioId: context.audioId,
            language: context.language || 'pt-BR'
        });
        try {
            // For now, return mock data - in production, integrate with Azure Speech Services
            // const speechConfig = SpeechConfig.fromSubscription(this.subscriptionKey, this.region);
            // const audioConfig = AudioConfig.fromWavFileInput(audioBuffer);
            // Mock implementation for development
            const mockResult = {
                recognizedText: "Esta é uma transcrição de teste do áudio fornecido. O sistema está funcionando corretamente.",
                confidence: 0.95,
                language: context.language || 'pt-BR',
                duration: 5.2,
                segments: [
                    {
                        text: "Esta é uma transcrição de teste",
                        startTime: 0.0,
                        endTime: 2.1,
                        confidence: 0.96
                    },
                    {
                        text: "do áudio fornecido",
                        startTime: 2.1,
                        endTime: 3.5,
                        confidence: 0.94
                    },
                    {
                        text: "O sistema está funcionando corretamente",
                        startTime: 3.5,
                        endTime: 5.2,
                        confidence: 0.95
                    }
                ]
            };
            logger_1.logger.info('Speech recognition completed', {
                audioId: context.audioId,
                textLength: mockResult.recognizedText.length,
                confidence: mockResult.confidence,
                duration: mockResult.duration
            });
            return {
                success: true,
                data: mockResult
            };
        }
        catch (error) {
            logger_1.logger.error('Speech recognition failed', {
                audioId: context.audioId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                error: `Speech recognition failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Sentiment analysis using Azure Text Analytics
     */
    async analyzeSentiment(text, context) {
        logger_1.logger.info('Starting sentiment analysis', {
            audioId: context.audioId,
            textLength: text.length
        });
        try {
            // Mock implementation for development
            const mockResult = {
                overallSentiment: 'neutral',
                confidence: 0.87,
                sentimentScores: {
                    positive: 0.25,
                    negative: 0.18,
                    neutral: 0.57
                },
                sentences: [
                    {
                        text: "Esta é uma transcrição de teste do áudio fornecido.",
                        sentiment: 'neutral',
                        confidence: 0.89,
                        offset: 0,
                        length: 50
                    },
                    {
                        text: "O sistema está funcionando corretamente.",
                        sentiment: 'positive',
                        confidence: 0.85,
                        offset: 51,
                        length: 40
                    }
                ]
            };
            logger_1.logger.info('Sentiment analysis completed', {
                audioId: context.audioId,
                overallSentiment: mockResult.overallSentiment,
                confidence: mockResult.confidence
            });
            return {
                success: true,
                data: mockResult
            };
        }
        catch (error) {
            logger_1.logger.error('Sentiment analysis failed', {
                audioId: context.audioId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                error: `Sentiment analysis failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Lie detection using advanced linguistic and emotional analysis
     */
    async detectLies(speechData, sentimentData, context) {
        logger_1.logger.info('Starting lie detection analysis', {
            audioId: context.audioId,
            textLength: speechData.recognizedText.length,
            hasSentimentData: !!sentimentData
        });
        try {
            // Sophisticated lie detection algorithm (simplified for demo)
            const linguisticAnalysis = this.analyzeLinguisticPatterns(speechData.recognizedText);
            const emotionalAnalysis = this.analyzeEmotionalPatterns(sentimentData);
            const consistencyAnalysis = this.analyzeConsistency(speechData);
            // Calculate composite lie detection score
            const lieDetectionScore = this.calculateLieScore(linguisticAnalysis, emotionalAnalysis, consistencyAnalysis);
            const indicators = this.identifyLieIndicators(linguisticAnalysis, emotionalAnalysis, consistencyAnalysis);
            const result = {
                lieDetectionScore,
                confidence: 0.82, // Based on model confidence
                indicators,
                analysis: {
                    linguisticFactors: linguisticAnalysis,
                    emotionalFactors: emotionalAnalysis,
                    consistencyFactors: consistencyAnalysis
                }
            };
            logger_1.logger.info('Lie detection completed', {
                audioId: context.audioId,
                lieDetectionScore,
                indicatorCount: indicators.length,
                confidence: result.confidence
            });
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            logger_1.logger.error('Lie detection failed', {
                audioId: context.audioId,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                success: false,
                error: `Lie detection failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    // Private analysis methods
    analyzeLinguisticPatterns(text) {
        // Simplified linguistic pattern analysis
        const words = text.toLowerCase().split(/\s+/);
        const hesitationWords = ['uh', 'um', 'eh', 'hmm', 'bem', 'né'];
        const fillerWords = ['tipo', 'sabe', 'então', 'assim', 'meio que'];
        const certaintyWords = ['certamente', 'definitivamente', 'absolutamente', 'obviamente'];
        const hesitationCount = words.filter(word => hesitationWords.includes(word)).length;
        const fillerCount = words.filter(word => fillerWords.includes(word)).length;
        const certaintyCount = words.filter(word => certaintyWords.includes(word)).length;
        // Calculate complexity score based on sentence structure
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
        const complexityScore = Math.min(avgWordsPerSentence / 15, 1); // Normalize to 0-1
        return {
            hesitationMarkers: hesitationCount / words.length,
            fillerWords: fillerCount / words.length,
            complexityScore,
            certaintyIndicators: certaintyCount / words.length
        };
    }
    analyzeEmotionalPatterns(sentimentData) {
        if (!sentimentData) {
            return {
                stressIndicators: 0.5, // Default moderate stress
                anxietyMarkers: 0.5,
                emotionalVariability: 0.5
            };
        }
        // Calculate emotional variability from sentence sentiments
        let emotionalVariability = 0;
        if (sentimentData.sentences && sentimentData.sentences.length > 1) {
            const sentiments = sentimentData.sentences.map(s => {
                switch (s.sentiment) {
                    case 'positive': return 1;
                    case 'negative': return -1;
                    default: return 0;
                }
            });
            const variance = this.calculateVariance(sentiments);
            emotionalVariability = Math.min(variance, 1);
        }
        return {
            stressIndicators: sentimentData.sentimentScores.negative,
            anxietyMarkers: 1 - sentimentData.confidence, // Lower confidence may indicate anxiety
            emotionalVariability
        };
    }
    analyzeConsistency(speechData) {
        // Simplified consistency analysis
        const segments = speechData.segments || [];
        // Calculate consistency based on confidence variations
        const confidences = segments.map(s => s.confidence);
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / Math.max(confidences.length, 1);
        const confidenceVariance = this.calculateVariance(confidences);
        return {
            internalConsistency: avgConfidence,
            temporalConsistency: 1 - confidenceVariance, // Lower variance = higher consistency
            logicalCoherence: avgConfidence // Simplified - in reality would analyze logical flow
        };
    }
    calculateLieScore(linguistic, emotional, consistency) {
        // Weighted composite score calculation
        const linguisticScore = (linguistic.hesitationMarkers * 0.3 +
            linguistic.fillerWords * 0.2 +
            (1 - linguistic.certaintyIndicators) * 0.2 +
            (1 - linguistic.complexityScore) * 0.3);
        const emotionalScore = (emotional.stressIndicators * 0.4 +
            emotional.anxietyMarkers * 0.3 +
            emotional.emotionalVariability * 0.3);
        const consistencyScore = ((1 - consistency.internalConsistency) * 0.4 +
            (1 - consistency.temporalConsistency) * 0.3 +
            (1 - consistency.logicalCoherence) * 0.3);
        // Weighted final score
        const finalScore = (linguisticScore * 0.4 +
            emotionalScore * 0.3 +
            consistencyScore * 0.3);
        return Math.max(0, Math.min(1, finalScore));
    }
    identifyLieIndicators(linguistic, emotional, consistency) {
        const indicators = [];
        // Linguistic indicators
        if (linguistic.hesitationMarkers > 0.05) {
            indicators.push({
                type: 'linguistic',
                indicator: 'high_hesitation',
                strength: linguistic.hesitationMarkers,
                description: 'Frequent hesitation markers detected'
            });
        }
        if (linguistic.fillerWords > 0.03) {
            indicators.push({
                type: 'linguistic',
                indicator: 'excessive_fillers',
                strength: linguistic.fillerWords,
                description: 'Excessive use of filler words'
            });
        }
        // Emotional indicators
        if (emotional.stressIndicators > 0.6) {
            indicators.push({
                type: 'emotional',
                indicator: 'stress_detected',
                strength: emotional.stressIndicators,
                description: 'High stress levels detected in speech'
            });
        }
        if (emotional.anxietyMarkers > 0.5) {
            indicators.push({
                type: 'emotional',
                indicator: 'anxiety_markers',
                strength: emotional.anxietyMarkers,
                description: 'Anxiety indicators present'
            });
        }
        // Consistency indicators
        if (consistency.internalConsistency < 0.7) {
            indicators.push({
                type: 'consistency',
                indicator: 'low_consistency',
                strength: 1 - consistency.internalConsistency,
                description: 'Internal inconsistencies detected'
            });
        }
        return indicators;
    }
    calculateVariance(numbers) {
        if (numbers.length === 0)
            return 0;
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
        return variance;
    }
    validateConfiguration() {
        if (!this.subscriptionKey) {
            logger_1.logger.warn('Azure AI subscription key not configured - using mock responses');
        }
        if (!this.region) {
            throw new Error('Azure AI region is required');
        }
    }
}
exports.AzureAIService = AzureAIService;
// Export singleton instance
exports.azureAIService = new AzureAIService();
//# sourceMappingURL=aiService.js.map