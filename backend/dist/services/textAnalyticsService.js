"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextAnalyticsService = void 0;
// Objeto padrão para OpinionMiningResult
const defaultOpinionMiningResult = {
    opinions: [],
    overallOpinionPolarity: 0,
    opinionTargets: [],
    conflictingOpinions: []
};
/**
 * Azure Text Analytics Service for sentiment analysis and language detection
 * Provides comprehensive text analysis including sentiment, key phrases, and entities
 */
const logger_1 = require("../utils/logger");
/**
 * Azure Text Analytics Service
 */
class TextAnalyticsService {
    constructor() {
        this.endpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || 'https://mock-text-analytics.cognitiveservices.azure.com/';
        // Removido para build limpo
        this.useMockData = !process.env.AZURE_TEXT_ANALYTICS_KEY;
        if (this.useMockData) {
            logger_1.logger.warn('Text Analytics Service initialized with mock data', {
                reason: 'Missing AZURE_TEXT_ANALYTICS_KEY environment variable'
            });
        }
        else {
            logger_1.logger.info('Text Analytics Service initialized with Azure API', {
                endpoint: this.endpoint
            });
        }
    }
    /**
     * Perform comprehensive text analysis
     */
    async analyzeText(request) {
        const startTime = Date.now();
        const requestLogger = (0, logger_1.createRequestLogger)(request.requestId, {
            functionName: 'analyzeText',
            textLength: request.text.length,
            language: request.language
        });
        requestLogger.info('Starting text analytics analysis', {
            useMockData: this.useMockData,
            options: request.analysisOptions
        });
        try {
            if (this.useMockData) {
                return await this.analyzeMockText(request, startTime, requestLogger);
            }
            else {
                return await this.analyzeAzureText(request, startTime, requestLogger);
            }
        }
        catch (error) {
            requestLogger.error('Text analytics analysis failed', {
                error: error instanceof Error ? error.message : String(error),
                processingTime: Date.now() - startTime
            });
            return {
                success: false,
                requestId: request.requestId,
                detectedLanguage: { language: 'unknown', confidence: 0, iso6391Name: 'unknown', name: 'Unknown' },
                sentiment: this.createEmptySentimentAnalysis(),
                keyPhrases: this.createEmptyKeyPhraseAnalysis(),
                entities: this.createEmptyEntityAnalysis(),
                processingTime: Date.now() - startTime,
                error: `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Analyze text using Azure Text Analytics API
     */
    async analyzeAzureText(request, startTime, requestLogger) {
        var _a, _b, _c, _d, _e, _f;
        const document = {
            id: request.requestId,
            text: request.text,
            language: request.language || 'pt'
        };
        // Prepare batch requests for different analysis types
        const analysisPromises = [];
        // Language detection (if not specified)
        if (!request.language && ((_a = request.analysisOptions) === null || _a === void 0 ? void 0 : _a.enableLanguageDetection) !== false) {
            analysisPromises.push(this.detectLanguage(document, requestLogger));
        }
        // Sentiment analysis
        if (((_b = request.analysisOptions) === null || _b === void 0 ? void 0 : _b.enableSentimentAnalysis) !== false) {
            analysisPromises.push(this.analyzeSentiment(document, requestLogger));
        }
        // Key phrase extraction
        if (((_c = request.analysisOptions) === null || _c === void 0 ? void 0 : _c.enableKeyPhraseExtraction) !== false) {
            analysisPromises.push(this.extractKeyPhrases(document, requestLogger));
        }
        // Entity recognition
        if (((_d = request.analysisOptions) === null || _d === void 0 ? void 0 : _d.enableEntityRecognition) !== false) {
            analysisPromises.push(this.recognizeEntities(document, requestLogger));
        }
        // Opinion mining
        if ((_e = request.analysisOptions) === null || _e === void 0 ? void 0 : _e.includeOpinionMining) {
            analysisPromises.push(this.mineOpinions(document, requestLogger));
        }
        const results = await Promise.allSettled(analysisPromises);
        // Process results
        const detectedLanguage = request.language
            ? { language: request.language, confidence: 1.0, iso6391Name: request.language, name: this.getLanguageName(request.language) }
            : this.processLanguageDetectionResult(results[0]);
        const sentiment = this.processSentimentResult(results[request.language ? 0 : 1]);
        const keyPhrases = this.processKeyPhrasesResult(results[request.language ? 1 : 2]);
        const entities = this.processEntitiesResult(results[request.language ? 2 : 3]);
        const opinionMining = ((_f = request.analysisOptions) === null || _f === void 0 ? void 0 : _f.includeOpinionMining)
            ? this.processOpinionMiningResult(results[results.length - 1])
            : undefined;
        requestLogger.info('Azure text analysis completed', {
            language: detectedLanguage.language,
            sentiment: sentiment.overallSentiment,
            keyPhrasesCount: keyPhrases.keyPhrases.length,
            entitiesCount: entities.entities.length,
            processingTime: Date.now() - startTime
        });
        return {
            success: true,
            requestId: request.requestId,
            detectedLanguage,
            sentiment,
            keyPhrases,
            entities,
            opinionMining: opinionMining !== null && opinionMining !== void 0 ? opinionMining : defaultOpinionMiningResult,
            processingTime: Date.now() - startTime
        };
    }
    /**
     * Analyze text using mock data for development
     */
    async analyzeMockText(request, startTime, requestLogger) {
        var _a;
        requestLogger.info('Using mock text analytics data');
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        const text = request.text.toLowerCase();
        // Mock language detection
        const detectedLanguage = {
            language: request.language || 'pt',
            confidence: 0.95,
            iso6391Name: 'pt',
            name: 'Portuguese'
        };
        // Mock sentiment analysis based on keywords
        const sentiment = this.generateMockSentiment(text);
        // Mock key phrases
        const keyPhrases = this.generateMockKeyPhrases(text);
        // Mock entities
        const entities = this.generateMockEntities(text);
        // Mock opinion mining if requested
        const opinionMining = ((_a = request.analysisOptions) === null || _a === void 0 ? void 0 : _a.includeOpinionMining)
            ? this.generateMockOpinionMining(text)
            : undefined;
        requestLogger.info('Mock text analysis completed', {
            sentiment: sentiment.overallSentiment,
            keyPhrasesCount: keyPhrases.keyPhrases.length,
            entitiesCount: entities.entities.length,
            processingTime: Date.now() - startTime
        });
        return {
            success: true,
            requestId: request.requestId,
            detectedLanguage,
            sentiment,
            keyPhrases,
            entities,
            opinionMining: opinionMining !== null && opinionMining !== void 0 ? opinionMining : defaultOpinionMiningResult,
            processingTime: Date.now() - startTime
        };
    }
    // Mock data generators
    generateMockSentiment(text) {
        const positiveWords = ['bom', 'ótimo', 'excelente', 'feliz', 'alegre', 'satisfeito'];
        const negativeWords = ['ruim', 'péssimo', 'triste', 'nervoso', 'preocupado', 'ansioso'];
        const neutralWords = ['talvez', 'normal', 'comum', 'regular'];
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;
        positiveWords.forEach(word => {
            if (text.includes(word))
                positiveScore += 0.2;
        });
        negativeWords.forEach(word => {
            if (text.includes(word))
                negativeScore += 0.2;
        });
        neutralWords.forEach(word => {
            if (text.includes(word))
                neutralScore += 0.1;
        });
        // Normalize scores
        const total = positiveScore + negativeScore + neutralScore + 0.3; // base neutral
        positiveScore = Math.min(0.9, positiveScore / total);
        negativeScore = Math.min(0.9, negativeScore / total);
        neutralScore = Math.max(0.1, 1 - positiveScore - negativeScore);
        let overallSentiment;
        if (Math.abs(positiveScore - negativeScore) < 0.1) {
            overallSentiment = 'mixed';
        }
        else if (positiveScore > negativeScore && positiveScore > neutralScore) {
            overallSentiment = 'positive';
        }
        else if (negativeScore > positiveScore && negativeScore > neutralScore) {
            overallSentiment = 'negative';
        }
        else {
            overallSentiment = 'neutral';
        }
        const sentences = this.generateMockSentenceSentiments(text, overallSentiment);
        const emotionalTone = this.generateMockEmotionalTone(text, overallSentiment);
        const stabilityMetrics = this.generateMockSentimentStability(sentences);
        return {
            overallSentiment,
            confidenceScores: {
                positive: positiveScore,
                negative: negativeScore,
                neutral: neutralScore
            },
            sentences,
            emotionalTone,
            stabilityMetrics
        };
    }
    generateMockSentenceSentiments(text, overallSentiment) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.map((sentence, index) => {
            const variance = (Math.random() - 0.5) * 0.4; // ±20% variance
            let sentiment = overallSentiment;
            // Add some variation
            if (Math.random() < 0.2) {
                const sentiments = ['positive', 'negative', 'neutral'];
                sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
            }
            const baseConfidence = 0.7;
            const confidenceScores = {
                positive: sentiment === 'positive' ? baseConfidence + Math.abs(variance) : 0.1 + Math.random() * 0.2,
                // O trecho acima estava corrompido. Removido instruções soltas e blocos inválidos.
                // Se necessário, reimplemente as funções de análise (detectLanguage, analyzeSentiment, extractKeyPhrases, recognizeEntities, mineOpinions, processLanguageDetectionResult, processSentimentResult, processKeyPhrasesResult, processEntitiesResult, processOpinionMiningResult) conforme a lógica do restante do serviço.
                generateMockSentimentStability(sentences) {
                    if (sentences.length < 2) {
                        return {
                            varianceScore: 0,
                            rapidChanges: 0,
                            consistency: 1,
                            patterns: ['insufficient_data']
                        };
                    }
                    let rapidChanges = 0;
                    let totalVariance = 0;
                    for (let i = 1; i < sentences.length; i++) {
                        const prev = sentences[i - 1];
                        const curr = sentences[i];
                        if (prev.sentiment !== curr.sentiment) {
                            rapidChanges++;
                        }
                        // Calculate confidence variance
                        const variance = Math.abs(prev.confidenceScores[prev.sentiment] - curr.confidenceScores[curr.sentiment]);
                        totalVariance += variance;
                    }
                    const varianceScore = totalVariance / (sentences.length - 1);
                    const consistency = 1 - (rapidChanges / sentences.length);
                    const patterns = [];
                    if (rapidChanges > sentences.length * 0.5) {
                        patterns.push('high_volatility');
                    }
                    if (consistency > 0.8) {
                        patterns.push('high_consistency');
                    }
                    if (varianceScore > 0.3) {
                        patterns.push('confidence_fluctuation');
                    }
                    return {
                        varianceScore,
                        rapidChanges,
                        consistency,
                        patterns
                    };
                },
                generateMockKeyPhrases(text) {
                    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                    const stopWords = ['para', 'com', 'por', 'sobre', 'entre', 'quando', 'onde', 'como', 'porque'];
                    const relevantWords = words.filter(word => !stopWords.includes(word));
                    // Generate key phrases
                    const keyPhrases = relevantWords
                        .slice(0, Math.min(10, relevantWords.length))
                        .filter((word, index, array) => array.indexOf(word) === index);
                    // Generate topics
                    const topics = keyPhrases.slice(0, 3).map(phrase => ({
                        topic: phrase,
                        confidence: 0.7 + Math.random() * 0.3,
                        relatedPhrases: keyPhrases.filter(kp => kp !== phrase).slice(0, 3),
                        prominence: Math.random()
                    }));
                    // Generate themes
                    const themes = {
                        primaryThemes: topics.slice(0, 2).map(t => t.topic),
                        secondaryThemes: topics.slice(2).map(t => t.topic),
                        thematicCoherence: 0.6 + Math.random() * 0.4,
                        topicDrift: Math.random() * 0.3
                    };
                    // Generate phrase importance
                    const importance = keyPhrases.map(phrase => ({
                        phrase,
                        importanceScore: Math.random(),
                        frequency: Math.floor(Math.random() * 5) + 1,
                        context: `Context for ${phrase}`
                    }));
                    return {
                        keyPhrases,
                        topics,
                        themes,
                        importance
                    };
                },
                generateMockEntities(text) {
                    const mockEntities = [];
                    const words = text.split(/\s+/);
                    // Look for potential person names (capitalized words)
                    const persons = [];
                    words.forEach((word, index) => {
                        if (word.match(/^[A-Z][a-z]+$/) && word.length > 2) {
                            persons.push(word);
                            mockEntities.push({
                                text: word,
                                category: 'Person',
                                confidence: 0.8 + Math.random() * 0.2,
                                offset: index * 6, // Approximate
                                length: word.length,
                                matches: [{
                                        text: word,
                                        offset: index * 6,
                                        length: word.length,
                                        confidence: 0.8 + Math.random() * 0.2
                                    }]
                            });
                        }
                    });
                    // Add some location entities
                    const locations = ['Brasil', 'São Paulo', 'Rio', 'casa', 'trabalho'];
                    locations.forEach(location => {
                        if (text.includes(location)) {
                            mockEntities.push({
                                text: location,
                                category: 'Location',
                                confidence: 0.7 + Math.random() * 0.3,
                                offset: text.indexOf(location),
                                length: location.length,
                                matches: [{
                                        text: location,
                                        offset: text.indexOf(location),
                                        length: location.length,
                                        confidence: 0.7 + Math.random() * 0.3
                                    }]
                            });
                        }
                    });
                    // Generate categories
                    const categories = [
                        { category: 'Person', count: persons.length, examples: persons.slice(0, 3), confidence: 0.8 },
                        { category: 'Location', count: 1, examples: ['São Paulo'], confidence: 0.7 }
                    ].filter(cat => cat.count > 0);
                    // Generate relationships
                    const relationships = [];
                    for (let i = 0; i < persons.length - 1; i++) {
                        relationships.push({
                            source: persons[i],
                            target: persons[i + 1],
                            relationship: 'knows',
                            confidence: 0.6
                        });
                    }
                    // Person information
                    const personInformation = {
                        persons,
                        personCount: persons.length,
                        relationshipDynamics: relationships.map(r => `${r.source} ${r.relationship} ${r.target}`),
                        nameConsistency: persons.length > 0 ? 0.9 : 1.0
                    };
                    return {
                        entities: mockEntities,
                        categories,
                        relationships,
                        personInformation
                    };
                },
                generateMockOpinionMining() {
                    const opinions = [
                        {
                            target: 'situação',
                            sentiment: 'negative',
                            confidence: 0.7,
                            assessments: ['difícil', 'complicada']
                        }
                    ];
                    const opinionTargets = opinions.map(op => ({
                        text: op.target,
                        sentiment: op.sentiment,
                        confidence: op.confidence,
                        mentions: 1
                    }));
                    return {
                        opinions,
                        overallOpinionPolarity: -0.2,
                        opinionTargets,
                        conflictingOpinions: []
                    };
                }
                // Azure API helper methods (would implement actual API calls in production)
                ,
                // Azure API helper methods (would implement actual API calls in production)
                async detectLanguage(requestLogger) {
                    requestLogger.info('Detecting language');
                    // Mock implementation - would call Azure API
                    return { language: 'pt', confidence: 0.95 };
                },
                async analyzeSentiment(requestLogger) {
                    requestLogger.info('Analyzing sentiment');
                    // Mock implementation - would call Azure API
                    return { sentiment: 'neutral', confidence: 0.8 };
                },
                async extractKeyPhrases(requestLogger) {
                    requestLogger.info('Extracting key phrases');
                    // Mock implementation - would call Azure API
                    return { keyPhrases: ['exemplo', 'teste'] };
                },
                async recognizeEntities(requestLogger) {
                    requestLogger.info('Recognizing entities');
                    // Mock implementation - would call Azure API
                    return { entities: [] };
                },
                async mineOpinions(requestLogger) {
                    requestLogger.info('Mining opinions');
                    // Mock implementation - would call Azure API
                    return { opinions: [] };
                }
                // Result processors (would process actual Azure API responses)
                ,
                // Result processors (would process actual Azure API responses)
                processLanguageDetectionResult() {
                    return {
                        language: 'pt',
                        confidence: 0.95,
                        iso6391Name: 'pt',
                        name: 'Portuguese'
                    };
                },
                processSentimentResult() {
                    return this.generateMockSentiment('texto exemplo');
                },
                processKeyPhrasesResult() {
                    return this.generateMockKeyPhrases('texto exemplo');
                },
                processEntitiesResult() {
                    return this.generateMockEntities('texto exemplo');
                },
                processOpinionMiningResult() {
                    return this.generateMockOpinionMining('texto exemplo');
                }
                // Utility methods
                ,
                // Utility methods
                getLanguageName(iso) {
                    const languageNames = {
                        'pt': 'Portuguese',
                        'en': 'English',
                        'es': 'Spanish',
                        'fr': 'French'
                    };
                    return languageNames[iso] || 'Unknown';
                },
                createEmptySentimentAnalysis() {
                    return {
                        overallSentiment: 'neutral',
                        confidenceScores: { positive: 0, negative: 0, neutral: 1 },
                        sentences: [],
                        emotionalTone: {
                            dominantEmotion: 'neutral',
                            emotionScores: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0 },
                            emotionalIntensity: 0,
                            emotionalComplexity: 0
                        },
                        stabilityMetrics: {
                            varianceScore: 0,
                            rapidChanges: 0,
                            consistency: 1,
                            patterns: []
                        }
                    };
                },
                createEmptyKeyPhraseAnalysis() {
                    return {
                        keyPhrases: [],
                        topics: [],
                        themes: {
                            primaryThemes: [],
                            secondaryThemes: [],
                            thematicCoherence: 0,
                            topicDrift: 0
                        },
                        importance: []
                    };
                },
                createEmptyEntityAnalysis() {
                    return {
                        entities: [],
                        categories: [],
                        relationships: [],
                        personInformation: {
                            persons: [],
                            personCount: 0,
                            relationshipDynamics: [],
                            nameConsistency: 1
                        }
                    };
                }
            };
            // Export singleton instance
            export const textAnalyticsService = new TextAnalyticsService();
        });
    }
}
exports.TextAnalyticsService = TextAnalyticsService;
//# sourceMappingURL=textAnalyticsService.js.map