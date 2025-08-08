"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeLie = analyzeLie;
const audioProcessingService_1 = require("../services/audioProcessingService");
async function analyzeLie(context, req) {
    context.log('Analyze lie endpoint called');
    try {
        // Validate request
        if (!req.body || !req.body.audio) {
            context.res = {
                status: 400,
                body: {
                    error: 'Audio data is required'
                }
            };
            return;
        }
        // Process audio (using mock service for now)
        const audioBuffer = Buffer.from(req.body.audio, 'base64');
        const analysisResult = await audioProcessingService_1.audioProcessingService.analyzeAudio(audioBuffer);
        // Mock lie detection result
        const lieScore = Math.random() * 100;
        const result = {
            lieScore: lieScore,
            confidence: 75 + Math.random() * 20,
            classification: lieScore > 60 ? 'lie' : lieScore > 40 ? 'uncertain' : 'truth',
            audioAnalysis: analysisResult,
            timestamp: new Date().toISOString()
        };
        context.res = {
            status: 200,
            body: result
        };
    }
    catch (error) {
        context.log.error('Error in analyzeLie:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}
exports.default = analyzeLie;
//# sourceMappingURL=analyzeLie.js.map