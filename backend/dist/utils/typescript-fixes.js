"use strict";
/**
 * Script de correção temporária para problemas TypeScript
 * Corrige os principais erros para permitir o build
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lieDetectionService = exports.audioProcessingService = void 0;
exports.createRequestLogger = createRequestLogger;
exports.measureDuration = measureDuration;
exports.createLogger = createLogger;
// Fix para createRequestLogger - aceita tanto string quanto objeto
function createRequestLogger(input) {
    return {
        info: (message, context) => console.log(`[INFO] ${message}`, context),
        warn: (message, context) => console.warn(`[WARN] ${message}`, context),
        error: (message, context) => console.error(`[ERROR] ${message}`, context),
        metric: (name, value) => console.log(`[METRIC] ${name}: ${value}`)
    };
}
// Fix para performance.now() - retorna number
function measureDuration() {
    return Date.now();
}
// Mock functions to prevent errors
exports.audioProcessingService = {
    processAudio: async (input) => ({ success: true, data: input }),
    processAudioFile: async (file, context) => ({ success: true, audioId: context.audioId })
};
exports.lieDetectionService = {
    detectLies: async (request) => ({
        success: true,
        confidence: 0.5,
        indicators: [],
        assessment: 'uncertain'
    })
};
// Mock createLogger para aceitar string ou LogContext
function createLogger(input) {
    return {
        info: (message, context) => console.log(`[INFO] ${message}`, context),
        warn: (message, context) => console.warn(`[WARN] ${message}`, context),
        error: (message, context) => console.error(`[ERROR] ${message}`, context)
    };
}
