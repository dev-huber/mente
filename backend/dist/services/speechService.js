"use strict";
/**
 * Serviço de Speech-to-Text Simplificado
 * Mock implementation para desenvolvimento
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.speechService = exports.SpeechService = void 0;
class SpeechService {
    constructor() {
        console.log('[SpeechService] Initialized (Mock Mode)');
    }
    async transcribeAudio(audioBuffer, language = 'pt-BR') {
        console.log('[SpeechService] Transcribing audio (mock)...');
        // Simulate processing time
        await this.delay(1000);
        // Mock transcription result
        const mockTexts = [
            'Esta é uma transcrição de exemplo para teste.',
            'O sistema está funcionando corretamente.',
            'Podemos detectar mentiras com alta precisão.',
            'A análise de áudio está sendo processada.'
        ];
        const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        return {
            text: randomText,
            confidence: 0.85 + Math.random() * 0.14, // 85-99%
            language,
            duration: 5.0 + Math.random() * 10, // 5-15 seconds
            segments: [
                {
                    text: randomText,
                    start: 0,
                    end: 5.0,
                    confidence: 0.9
                }
            ]
        };
    }
    async detectLanguage(audioBuffer) {
        console.log('[SpeechService] Detecting language (mock)...');
        // Always return Portuguese for mock
        return 'pt-BR';
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.SpeechService = SpeechService;
exports.speechService = new SpeechService();
