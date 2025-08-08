/**
 * Serviço de Speech-to-Text Simplificado
 * Mock implementation para desenvolvimento
 */
export interface TranscriptionResult {
    text: string;
    confidence: number;
    language: string;
    duration: number;
    segments: any[];
}
export interface SpeechRecognitionResult {
    success: boolean;
    transcription: string;
    confidence: number;
}
export declare class SpeechService {
    constructor();
    transcribeAudio(audioBuffer: Buffer, language?: string): Promise<TranscriptionResult>;
    detectLanguage(audioBuffer: Buffer): Promise<string>;
    private delay;
}
export declare const speechService: SpeechService;
//# sourceMappingURL=speechService.d.ts.map