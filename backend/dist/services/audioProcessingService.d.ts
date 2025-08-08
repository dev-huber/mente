/**
 * Serviço de Processamento de Áudio Simplificado
 * Mock implementation para desenvolvimento
 */
export interface AudioAnalysisResult {
    duration: number;
    format: string;
    sampleRate: number;
    channels: number;
    bitrate: number;
    size: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
}
export interface ProcessingContext {
    audioId: string;
    userId: string;
}
export declare class AudioProcessingService {
    constructor();
    analyzeAudio(audioBuffer: Buffer): Promise<AudioAnalysisResult>;
    normalizeAudio(audioBuffer: Buffer): Promise<Buffer>;
    extractFeatures(audioBuffer: Buffer): Promise<any>;
    validateUploadRequest(request: any): Promise<{
        valid: boolean;
        error?: string;
    }>;
    processAudioFile(file: any, context: ProcessingContext): Promise<any>;
    handleUploadError(error: Error): any;
    private determineQuality;
}
export declare const audioProcessingService: AudioProcessingService;
export declare function validateUploadRequest(request: any): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function processAudioFile(file: any, context: ProcessingContext): Promise<any>;
export declare function handleUploadError(error: Error): any;
//# sourceMappingURL=audioProcessingService.d.ts.map