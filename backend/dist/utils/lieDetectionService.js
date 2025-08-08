"use strict";
/**
 * Serviço de Detecção de Mentiras - Core do App "Quem Mente Menos?"
 * Implementa algoritmo defensivo de análise com múltiplas camadas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lieDetectionService = exports.LieDetectionService = void 0;
const logger_1 = require("@/utils/logger");
const CustomErrors_1 = require("@/core/errors/CustomErrors");
const circuitBreaker_1 = require("@/utils/circuitBreaker");
const retryPolicy_1 = require("@/utils/retryPolicy");
class LieDetectionService {
    weights = {
        linguistic: 0.35,
        vocal: 0.30,
        sentiment: 0.20,
        consistency: 0.15,
    };
    thresholds = {
        lie: 70,
        truth: 30,
        highConfidence: 80,
        lowConfidence: 40,
    };
    circuitBreaker;
    retryPolicy;
    constructor() {
        this.circuitBreaker = new circuitBreaker_1.CircuitBreaker({
            failureThreshold: 3,
            resetTimeout: 30000,
            monitoringPeriod: 60000,
        });
        this.retryPolicy = new retryPolicy_1.RetryPolicy({
            maxRetries: 2,
            initialDelay: 500,
            maxDelay: 2000,
            factor: 2,
        });
    }
    async detectLie(input) {
        const timer = logger_1.logger.startTimer();
        try {
            // Validação defensiva de entrada
            this.validateInput(input);
            // Análise paralela de componentes
            const [linguistic, vocal, sentiment, consistency] = await Promise.all([
                this.analyzeLinguisticPatterns(input.transcription),
                this.analyzeVocalPatterns(input.vocalAnalysis),
                this.analyzeSentiment(input.sentiment),
                this.analyzeConsistency(input),
            ]);
            // Cálculo do score final
            const lieScore = this.calculateFinalScore({
                linguistic,
                vocal,
                sentiment,
                consistency,
            });
            // Determinação da confiança
            const confidence = this.calculateConfidence({
                linguistic,
                vocal,
                sentiment,
                consistency,
            });
            // Classificação final
            const classification = this.classify(lieScore, confidence);
            // Geração de explicação e indicadores
            const { explanation, keyIndicators } = this.generateExplanation({
                lieScore,
                confidence,
                classification,
                components: { linguistic, vocal, sentiment, consistency },
            });
            // Sugestões para melhorar análise
            const suggestions = this.generateSuggestions(confidence, input);
            const duration = timer();
            logger_1.logger.info('Análise de mentira concluída', {
                operation: 'detectLie',
                service: 'LieDetectionService',
                duration,
                metadata: { lieScore, confidence, classification },
            });
            logger_1.logger.metric('lie_detection_score', lieScore);
            logger_1.logger.metric('lie_detection_confidence', confidence);
            return {
                lieScore,
                confidence,
                classification,
                explanation,
                keyIndicators,
                suggestions,
                details: {
                    linguisticScore: linguistic,
                    vocalScore: vocal,
                    sentimentScore: sentiment,
                    consistencyScore: consistency,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Falha na detecção de mentira', error, {
                operation: 'detectLie',
                service: 'LieDetectionService',
            });
            if (error instanceof CustomErrors_1.BusinessLogicError) {
                throw error;
            }
            throw new CustomErrors_1.BusinessLogicError('Não foi possível analisar o áudio', CustomErrors_1.ErrorCode.LIE_DETECTION_FAILED, { operation: 'detectLie' });
        }
    }
    validateInput(input) {
        if (!input.transcription?.text || input.transcription.text.trim().length < 10) {
            throw new CustomErrors_1.BusinessLogicError('Texto muito curto para análise confiável', CustomErrors_1.ErrorCode.VALIDATION_ERROR, { operation: 'validateInput' });
        }
        if (!input.vocalAnalysis || !input.sentiment) {
            throw new CustomErrors_1.BusinessLogicError('Dados insuficientes para análise', CustomErrors_1.ErrorCode.VALIDATION_ERROR, { operation: 'validateInput' });
        }
    }
    async analyzeLinguisticPatterns(transcription) {
        let score = 0;
        // Detectar hesitações
        const hesitations = this.countHesitations(transcription.text);
        if (hesitations > 3)
            score += 20;
        else if (hesitations > 1)
            score += 10;
        // Detectar palavras de preenchimento
        const fillerWords = this.countFillerWords(transcription.text);
        if (fillerWords > 5)
            score += 15;
        else if (fillerWords > 2)
            score += 7;
        // Detectar negações excessivas
        const negations = this.countNegations(transcription.text);
        if (negations > 4)
            score += 15;
        else if (negations > 2)
            score += 8;
        // Analisar complexidade (frases muito elaboradas podem indicar mentira)
        const complexity = this.analyzeComplexity(transcription.text);
        if (complexity > 0.7)
            score += 20;
        else if (complexity > 0.5)
            score += 10;
        // Detectar mudanças de tempo verbal
        const tenseChanges = this.detectTenseChanges(transcription.text);
        if (tenseChanges > 3)
            score += 15;
        else if (tenseChanges > 1)
            score += 7;
        // Analisar distanciamento (uso de terceira pessoa)
        const distancing = this.detectDistancing(transcription.text);
        if (distancing)
            score += 15;
        return Math.min(100, score);
    }
    async analyzeVocalPatterns(vocalAnalysis) {
        let score = 0;
        // Alta variação de pitch indica stress
        if (vocalAnalysis.pitchStd > 50)
            score += 25;
        else if (vocalAnalysis.pitchStd > 30)
            score += 15;
        // Taxa de fala anormal
        if (vocalAnalysis.speakingRate < 100 || vocalAnalysis.speakingRate > 200) {
            score += 20;
        }
        else if (vocalAnalysis.speakingRate < 120 || vocalAnalysis.speakingRate > 180) {
            score += 10;
        }
        // Muitas pausas
        if (vocalAnalysis.pauseRatio > 0.4)
            score += 25;
        else if (vocalAnalysis.pauseRatio > 0.25)
            score += 15;
        // Variação de energia (nervosismo)
        if (vocalAnalysis.energyStd > 40)
            score += 20;
        else if (vocalAnalysis.energyStd > 25)
            score += 10;
        // Pitch anormalmente alto (tensão)
        if (vocalAnalysis.pitchMean > 250)
            score += 10;
        return Math.min(100, score);
    }
    async analyzeSentiment(sentiment) {
        let score = 0;
        // Negatividade excessiva
        if (sentiment.negative > 0.6)
            score += 30;
        else if (sentiment.negative > 0.4)
            score += 15;
        // Intensidade emocional anormal
        if (sentiment.intensity > 0.8 || sentiment.intensity < 0.2) {
            score += 25;
        }
        else if (sentiment.intensity > 0.7 || sentiment.intensity < 0.3) {
            score += 12;
        }
        // Inconsistência emocional
        const emotionalVariance = Math.abs(sentiment.positive - sentiment.negative);
        if (emotionalVariance < 0.1)
            score += 20; // Emoções muito neutras podem ser falsas
        return Math.min(100, score);
    }
    async analyzeConsistency(input) {
        let score = 0;
        // Verificar consistência entre vocal e sentimento
        const vocalStress = (input.vocalAnalysis.pitchStd + input.vocalAnalysis.energyStd) / 2;
        const emotionalIntensity = input.sentiment.intensity * 100;
        const inconsistency = Math.abs(vocalStress - emotionalIntensity);
        if (inconsistency > 40)
            score += 30;
        else if (inconsistency > 20)
            score += 15;
        // Verificar consistência temporal
        const temporalInconsistencies = this.checkTemporalConsistency(input.transcription.text);
        if (temporalInconsistencies > 2)
            score += 25;
        else if (temporalInconsistencies > 0)
            score += 12;
        // Verificar contradições
        const contradictions = this.findContradictions(input.transcription.text);
        if (contradictions > 0)
            score += 30;
        return Math.min(100, score);
    }
    calculateFinalScore(components) {
        const weightedScore = components.linguistic * this.weights.linguistic +
            components.vocal * this.weights.vocal +
            components.sentiment * this.weights.sentiment +
            components.consistency * this.weights.consistency;
        return Math.round(Math.min(100, Math.max(0, weightedScore)));
    }
    calculateConfidence(components) {
        // Confiança baseada na convergência dos indicadores
        const scores = [
            components.linguistic,
            components.vocal,
            components.sentiment,
            components.consistency,
        ];
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const std = Math.sqrt(variance);
        // Menor desvio padrão = maior confiança
        const confidence = Math.max(0, 100 - std * 2);
        return Math.round(confidence);
    }
    classify(lieScore, confidence) {
        if (confidence < this.thresholds.lowConfidence) {
            return 'uncertain';
        }
        if (lieScore >= this.thresholds.lie) {
            return 'lie';
        }
        else if (lieScore <= this.thresholds.truth) {
            return 'truth';
        }
        else {
            return 'uncertain';
        }
    }
    generateExplanation(data) {
        const { lieScore, confidence, classification, components } = data;
        const indicators = [];
        // Identificar principais indicadores
        if (components.linguistic > 60) {
            indicators.push('Padrões linguísticos suspeitos detectados');
        }
        if (components.vocal > 60) {
            indicators.push('Alterações vocais significativas');
        }
        if (components.sentiment > 60) {
            indicators.push('Inconsistências emocionais');
        }
        if (components.consistency > 60) {
            indicators.push('Contradições identificadas');
        }
        // Gerar explicação baseada na classificação
        let explanation = '';
        if (classification === 'lie') {
            explanation = `Com ${confidence}% de confiança, a análise indica alta probabilidade de mentira (score: ${lieScore}/100). `;
            explanation += indicators.length > 0
                ? `Principais indicadores: ${indicators.join(', ')}.`
                : 'Múltiplos fatores convergem para esta conclusão.';
        }
        else if (classification === 'truth') {
            explanation = `Com ${confidence}% de confiança, a análise indica alta probabilidade de verdade (score: ${lieScore}/100). `;
            explanation += 'Os padrões vocais e linguísticos estão dentro do esperado para um discurso verdadeiro.';
        }
        else {
            explanation = `Análise inconclusiva (score: ${lieScore}/100, confiança: ${confidence}%). `;
            explanation += 'Recomenda-se coletar mais dados ou repetir a análise com áudio de melhor qualidade.';
        }
        return { explanation, keyIndicators: indicators };
    }
    generateSuggestions(confidence, input) {
        const suggestions = [];
        if (confidence < 60) {
            suggestions.push('Tente gravar em ambiente mais silencioso');
            suggestions.push('Fale de forma mais clara e pausada');
        }
        if (input.transcription.text.length < 50) {
            suggestions.push('Respostas mais longas fornecem análise mais precisa');
        }
        if (input.vocalAnalysis.pauseRatio > 0.3) {
            suggestions.push('Evite pausas muito longas durante a fala');
        }
        return suggestions;
    }
    // Métodos auxiliares de análise
    countHesitations(text) {
        const hesitationPatterns = /\b(uh|um|eh|ah|er|hmm)\b/gi;
        return (text.match(hesitationPatterns) || []).length;
    }
    countFillerWords(text) {
        const fillerPatterns = /\b(tipo|assim|né|sabe|então|aí|daí)\b/gi;
        return (text.match(fillerPatterns) || []).length;
    }
    countNegations(text) {
        const negationPatterns = /\b(não|nunca|jamais|nada|nenhum|nem)\b/gi;
        return (text.match(negationPatterns) || []).length;
    }
    analyzeComplexity(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const avgWordsPerSentence = text.split(/\s+/).length / sentences.length;
        return Math.min(1, avgWordsPerSentence / 30);
    }
    detectTenseChanges(text) {
        // Simplificado - conta mudanças entre passado/presente/futuro
        const pastPatterns = /\b(foi|era|tinha|estava|fiz|fez)\b/gi;
        const presentPatterns = /\b(é|sou|tenho|estou|faço|faz)\b/gi;
        const futurePatterns = /\b(será|vou|vai|terei|estarei|farei)\b/gi;
        const hasPast = pastPatterns.test(text);
        const hasPresent = presentPatterns.test(text);
        const hasFuture = futurePatterns.test(text);
        return [hasPast, hasPresent, hasFuture].filter(Boolean).length - 1;
    }
    detectDistancing(text) {
        const firstPerson = /\b(eu|me|mim|meu|minha)\b/gi;
        const thirdPerson = /\b(ele|ela|dele|dela|aquilo|isso)\b/gi;
        const firstCount = (text.match(firstPerson) || []).length;
        const thirdCount = (text.match(thirdPerson) || []).length;
        return thirdCount > firstCount * 1.5;
    }
    checkTemporalConsistency(text) {
        // Detecta inconsistências temporais básicas
        const timeMarkers = /(ontem|hoje|amanhã|semana passada|ano passado|agora|depois|antes)/gi;
        const matches = text.match(timeMarkers) || [];
        // Verifica se há muitas mudanças temporais (possível sinal de confusão/mentira)
        return matches.length > 5 ? Math.floor(matches.length / 3) : 0;
    }
    findContradictions(text) {
        // Detecta padrões contraditórios simples
        const contradictionPatterns = [
            /\bmais\b.*\bmenos\b/gi,
            /\bsempre\b.*\bnunca\b/gi,
            /\btudo\b.*\bnada\b/gi,
            /\bsim\b.*\bnão\b/gi,
        ];
        return contradictionPatterns.reduce((count, pattern) => {
            return count + (pattern.test(text) ? 1 : 0);
        }, 0);
    }
}
exports.LieDetectionService = LieDetectionService;
// Singleton export
exports.lieDetectionService = new LieDetectionService();
