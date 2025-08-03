/**
 * Azure Speech Services integration for high-precision speech-to-text
 * Implements defensive patterns with comprehensive error handling and fallbacks
 */
export interface SpeechRecognitionRequest {
    audioBuffer: Buffer;
    audioFormat: 'mp3' | 'wav' | 'aac' | 'm4a';
    language?: string;
    requestId: string;
    options?: SpeechRecognitionOptions;
}
export interface SpeechRecognitionOptions {
    enableDetailedResults?: boolean;
    enableWordTimestamps?: boolean;
    profanityOption?: 'masked' | 'removed' | 'raw';
    enableAutomaticPunctuation?: boolean;
    maxAlternatives?: number;
    customModelId?: string;
}
export interface SpeechRecognitionResult {
    success: boolean;
    requestId: string;
    recognizedText: string;
    confidence: number;
    language: string;
    duration: number;
    audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
    segments: SpeechSegment[];
    alternatives?: AlternativeTranscription[];
    error?: string;
}
export interface SpeechSegment {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
    words?: WordDetail[];
}
export interface WordDetail {
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
}
export interface AlternativeTranscription {
    text: string;
    confidence: number;
}
export interface AudioQualityMetrics {
    signalToNoiseRatio: number;
    volumeLevel: number;
    clarity: number;
    backgroundNoise: number;
    speechRate: number;
}
/**
 * Azure Speech Services client with defensive programming
 */
export declare class AzureSpeechService {
    private subscriptionKey;
    private region;
    private endpoint;
    private maxRetries;
    private retryDelayMs;
    constructor();
    /**
     * Recognize speech from audio buffer with comprehensive error handling
     */
    recognizeSpeech(request: SpeechRecognitionRequest): Promise<SpeechRecognitionResult>;
    /**
     * Validate speech recognition request
     */
    private validateSpeechRequest;
    /**
     * Analyze audio quality to optimize recognition
     */
    private analyzeAudioQuality;
    /**
     * Pre-process audio to improve recognition accuracy
     */
    private preprocessAudio;
    /**
     * Perform speech recognition with retry logic
     */
    private performSpeechRecognitionWithRetry;
    /**
     * Call Azure Speech API (simplified implementation for development)
     */
    private callAzureSpeechAPI;
    /**
     * Enhance recognition result with additional analysis
     */
    private enhanceRecognitionResult;
    private validateConfiguration;
    private estimateAudioDuration;
    private generateMockTranscription;
    private generateMockSegments;
    private generateWordTimestamps;
    private generateAlternativeTranscriptions;
    private determineAudioQuality;
    private delay;
}
export declare const azureSpeechService: AzureSpeechService;
//# sourceMappingURL=speechService.d.ts.map