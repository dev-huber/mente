import { HttpRequest } from '@azure/functions';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { Buffer } from 'buffer';

/**
 * Audio file processing service with defensive validation and error handling
 */

// Validation schemas
const uploadRequestSchema = Joi.object({
    contentType: Joi.string().valid(
        'audio/mpeg',
        'audio/wav', 
        'audio/aac',
        'audio/m4a',
        'audio/mp4',
        'multipart/form-data'
    ).required(),
    contentLength: Joi.number().min(1).max(50 * 1024 * 1024).required(), // Max 50MB
});

const audioMetadataSchema = Joi.object({
    duration: Joi.number().min(0).max(300), // Max 5 minutes
    timestamp: Joi.string().isoDate(),
    userId: Joi.string().max(100),
    appVersion: Joi.string().max(20),
    deviceInfo: Joi.string().max(200)
}).unknown(true);

// File processing interfaces
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
export async function validateUploadRequest(
    request: HttpRequest
): Promise<ServiceResult<FileData>> {
    try {
        logger.info('Starting request validation', { 
            method: request.method,
            contentType: request.headers.get('content-type'),
            contentLength: request.headers.get('content-length')
        });

        // Method validation
        if (request.method !== 'POST') {
            return {
                success: false,
                error: `Method ${request.method} not allowed. Use POST.`
            };
        }

        // Content-Type validation
        const contentType = request.headers.get('content-type');
        const contentLength = parseInt(request.headers.get('content-length') || '0');

        const validationResult = uploadRequestSchema.validate({
            contentType,
            contentLength
        });

        if (validationResult.error) {
            return {
                success: false,
                error: `Invalid request: ${validationResult.error.details[0].message}`
            };
        }

        // Extract file data based on content type
        let fileData: FileData;

        if (contentType?.startsWith('multipart/form-data')) {
            fileData = await extractFromMultipart(request);
        } else if (contentType?.startsWith('audio/')) {
            fileData = await extractFromDirectUpload(request, contentType);
        } else {
            return {
                success: false,
                error: 'Unsupported content type. Use multipart/form-data or direct audio upload.'
            };
        }

        // File size validation
        if (fileData.buffer.length === 0) {
            return {
                success: false,
                error: 'Empty file received'
            };
        }

        if (fileData.buffer.length > 50 * 1024 * 1024) {
            return {
                success: false,
                error: 'File too large. Maximum size is 50MB.'
            };
        }

        // Metadata validation if present
        if (fileData.metadata) {
            const metadataValidation = audioMetadataSchema.validate(fileData.metadata);
            if (metadataValidation.error) {
                logger.warn('Invalid metadata, proceeding without it', {
                    error: metadataValidation.error.details[0].message
                });
                delete fileData.metadata;
            }
        }

        logger.info('Request validation successful', {
            fileSize: fileData.buffer.length,
            mimeType: fileData.mimeType,
            originalName: fileData.originalName
        });

        return {
            success: true,
            data: fileData
        };

    } catch (error) {
        logger.error('Validation error', { 
            error: error instanceof Error ? error.message : String(error) 
        });
        
        return {
            success: false,
            error: 'Request validation failed'
        };
    }
}

/**
 * Extract file data from multipart form data
 */
async function extractFromMultipart(request: HttpRequest): Promise<FileData> {
    try {
        // Get raw body as buffer
        const bodyBuffer = await request.arrayBuffer();
        const body = Buffer.from(bodyBuffer);
        
        // Parse multipart data (simplified implementation)
        const boundary = extractBoundary(request.headers.get('content-type') || '');
        if (!boundary) {
            throw new Error('Missing multipart boundary');
        }

        const parts = parseMultipartData(body, boundary);
        const filePart = parts.find(part => part.name === 'audio' && part.filename);
        
        if (!filePart) {
            throw new Error('No audio file found in multipart data');
        }

        // Extract metadata if present
        const metadataPart = parts.find(part => part.name === 'metadata');
        let metadata: Record<string, any> | undefined;
        
        if (metadataPart) {
            try {
                metadata = JSON.parse(metadataPart.data.toString('utf8'));
            } catch {
                logger.warn('Failed to parse metadata, ignoring');
            }
        }

        return {
            buffer: filePart.data,
            originalName: filePart.filename || 'unknown.aac',
            mimeType: filePart.contentType || 'audio/aac',
            metadata: metadata || undefined
        };

    } catch (error) {
        throw new Error(`Multipart parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Extract file data from direct audio upload
 */
async function extractFromDirectUpload(request: HttpRequest, contentType: string): Promise<FileData> {
    try {
        const bodyBuffer = await request.arrayBuffer();
        const body = Buffer.from(bodyBuffer);
        
        // Extract filename from Content-Disposition header if present
        const contentDisposition = request.headers.get('content-disposition');
        const filename = extractFilenameFromHeader(contentDisposition) || 'upload.aac';

        return {
            buffer: body,
            originalName: filename,
            mimeType: contentType,
            metadata: undefined
        };

    } catch (error) {
        throw new Error(`Direct upload processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Process audio file with validation and basic analysis
 */
export async function processAudioFile(
    fileData: FileData,
    context: ProcessingContext
): Promise<ServiceResult<ProcessedAudioData>> {
    try {
        logger.info('Starting audio processing', {
            fileId: context.fileId,
            fileSize: fileData.buffer.length,
            mimeType: fileData.mimeType
        });

        // Validate audio file header
        const headerValidation = validateAudioHeader(fileData.buffer, fileData.mimeType);
        if (!headerValidation.success) {
            return {
                success: false,
                error: headerValidation.error || 'Header validation failed'
            };
        }

        // Extract basic audio properties
        const audioProps = await extractAudioProperties(fileData.buffer, fileData.mimeType);
        if (!audioProps.success) {
            return {
                success: false,
                error: audioProps.error || 'Property extraction failed'
            };
        }

        // Validate audio properties
        if (audioProps.data!.duration > 300) { // 5 minutes max
            return {
                success: false,
                error: 'Audio duration exceeds maximum limit of 5 minutes'
            };
        }

        if (audioProps.data!.sampleRate < 8000 || audioProps.data!.sampleRate > 48000) {
            return {
                success: false,
                error: 'Invalid sample rate. Must be between 8kHz and 48kHz'
            };
        }

        // For now, return the original buffer (in production, might apply processing)
        const processedData: ProcessedAudioData = {
            processedBuffer: fileData.buffer,
            audioDuration: audioProps.data!.duration,
            sampleRate: audioProps.data!.sampleRate,
            channels: audioProps.data!.channels,
            format: audioProps.data!.format
        };

        logger.info('Audio processing completed', {
            fileId: context.fileId,
            duration: processedData.audioDuration,
            sampleRate: processedData.sampleRate,
            channels: processedData.channels
        });

        return {
            success: true,
            data: processedData
        };

    } catch (error) {
        logger.error('Audio processing error', {
            fileId: context.fileId,
            error: error instanceof Error ? error.message : String(error)
        });

        return {
            success: false,
            error: 'Audio processing failed'
        };
    }
}

/**
 * Handle upload errors with structured logging
 */
export function handleUploadError(error: unknown, context: Record<string, any>): any {
    const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
        context
    };

    // Log error details
    logger.error('Upload error details', errorInfo);

    return errorInfo;
}

// Helper functions
function extractBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=([^;]+)/);
    return match ? match[1].replace(/"/g, '') : null;
}

function parseMultipartData(body: Buffer, boundary: string): Array<{
    name: string;
    filename?: string;
    contentType?: string;
    data: Buffer;
}> {
    // Simplified multipart parser - in production, use a proper library
    const parts: Array<{
        name: string;
        filename?: string;
        contentType?: string;
        data: Buffer;
    }> = [];

    const sections = body.toString('binary').split(`--${boundary}`);

    for (const section of sections) {
        if (section.includes('Content-Disposition')) {
            const [headers, ...bodyParts] = section.split('\r\n\r\n');
            const bodyStr = bodyParts.join('\r\n\r\n').replace(/\r\n--$/, '');
            
            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);

            if (nameMatch) {
                const part: { name: string; filename?: string; contentType?: string; data: Buffer } = {
                    name: nameMatch[1],
                    data: Buffer.from(bodyStr, 'binary')
                };
                if (filenameMatch && filenameMatch[1] !== undefined) {
                    part.filename = filenameMatch[1];
                }
                if (contentTypeMatch && contentTypeMatch[1] !== undefined) {
                    part.contentType = contentTypeMatch[1];
                }
                parts.push(part);
            }
        }
    }

    return parts;
}

function extractFilenameFromHeader(header: string | null): string | null {
    if (!header) return null;
    const match = header.match(/filename="([^"]+)"/);
    return match ? match[1] : null;
}

function validateAudioHeader(buffer: Buffer, mimeType: string): ServiceResult<boolean> {
    try {
        // Basic header validation based on file type
        if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
            // Check for MP3 header
            if (buffer.length < 3) return { success: false, error: 'File too small' };
            
            const header = buffer.subarray(0, 3);
            if (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) {
                return { success: true };
            }
            if (header.toString() === 'ID3') {
                return { success: true };
            }
        } else if (mimeType.includes('wav')) {
            // Check for WAV header
            if (buffer.length < 12) return { success: false, error: 'File too small' };
            
            const riffHeader = buffer.subarray(0, 4).toString();
            const waveHeader = buffer.subarray(8, 12).toString();
            
            if (riffHeader === 'RIFF' && waveHeader === 'WAVE') {
                return { success: true };
            }
        } else if (mimeType.includes('aac') || mimeType.includes('m4a')) {
            // Basic AAC/M4A validation
            if (buffer.length < 8) return { success: false, error: 'File too small' };
            
            // Look for AAC or M4A markers
            const header = buffer.subarray(0, 8);
            if (header.includes(Buffer.from('ftyp')) || header[0] === 0xFF && (header[1] & 0xF0) === 0xF0) {
                return { success: true };
            }
        }

        return { success: false, error: 'Invalid audio file format' };

    } catch (error) {
        return { 
            success: false, 
            error: `Header validation failed: ${error instanceof Error ? error.message : String(error)}` 
        };
    }
}

async function extractAudioProperties(buffer: Buffer, mimeType: string): Promise<ServiceResult<{
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
}>> {
    try {
        // Simplified audio property extraction
        // In production, use proper audio analysis libraries
        
        let duration = 0;
        let sampleRate = 44100; // Default
        let channels = 1; // Default mono
        let format = 'unknown';

        if (mimeType.includes('wav')) {
            // Extract WAV properties
            if (buffer.length >= 44) {
                sampleRate = buffer.readUInt32LE(24);
                channels = buffer.readUInt16LE(22);
                const byteRate = buffer.readUInt32LE(28);
                const dataSize = buffer.readUInt32LE(40);
                duration = dataSize / byteRate;
                format = 'wav';
            }
        } else {
            // For other formats, estimate duration based on file size and bitrate
            const estimatedBitrate = 128000; // 128 kbps average
            duration = (buffer.length * 8) / estimatedBitrate;
            format = mimeType.split('/')[1] || 'unknown';
        }

        return {
            success: true,
            data: {
                duration: Math.max(duration, 1), // Minimum 1 second
                sampleRate,
                channels,
                format
            }
        };

    } catch (error) {
        return {
            success: false,
            error: `Property extraction failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
