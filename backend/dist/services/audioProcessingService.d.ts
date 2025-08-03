import { HttpRequest } from '@azure/functions';
import { Buffer } from 'buffer';
export interface FileData {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    metadata?: Record<string, any> | undefined;
}
export interface ProcessingContext {
    fileId: string;
    fileName: string;
    requestId: string;
    context: Record<string, any>;
}
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string | undefined;
}
export interface ProcessedAudioData {
    processedBuffer: Buffer;
    audioDuration: number;
    sampleRate: number;
    channels: number;
    format: string;
}
/**
 * Validate upload request with comprehensive checks
 */
export declare function validateUploadRequest(request: HttpRequest): Promise<ServiceResult<FileData>>;
/**
 * Process audio file with validation and basic analysis
 */
export declare function processAudioFile(fileData: FileData, context: ProcessingContext): Promise<ServiceResult<ProcessedAudioData>>;
/**
 * Handle upload errors with structured logging
 */
export declare function handleUploadError(error: unknown, context: Record<string, any>): any;
//# sourceMappingURL=audioProcessingService.d.ts.map