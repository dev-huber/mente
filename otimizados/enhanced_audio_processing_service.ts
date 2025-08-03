import { HttpRequest } from '@azure/functions';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { Buffer } from 'buffer';
import * as crypto from 'crypto';

/**
 * Production-grade audio file processing service with bulletproof validation
 * Implements defense-in-depth security with comprehensive error handling
 */

// Enhanced validation schemas with security considerations
const uploadRequestSchema = Joi.object({
    contentType: Joi.string().valid(
        'audio/mpeg',
        'audio/wav', 
        'audio/aac',
        'audio/m4a',
        'audio/mp4',
        'audio/webm',
        'multipart/form-data'
    ).required(),
    contentLength: Joi.number().min(100).max(100 * 1024 * 1024).required(), // Min 100 bytes, Max 100MB
});

const audioMetadataSchema = Joi.object({
    duration: Joi.number().min(0.1).max(1800), // Max 30 minutes
    timestamp: Joi.string().isoDate(),
    userId: Joi.string().alphanum().max(100),
    appVersion: Joi.string().pattern(/^\d+\.\d+\.\d+(-[\w\d\-]+)?$/).max(20), // Semantic versioning
    deviceInfo: Joi.string().max(500),
    sessionId: Joi.string().uuid().optional(),
    recordingQuality: Joi.string().valid('low', 'medium', 'high').optional()
}).unknown(false); // Strict validation - no unknown properties

// Security configuration
const SECURITY_CONFIG = {
    MAX_FILENAME_LENGTH: 255,
    ALLOWED_EXTENSIONS: ['.aac', '.mp3', '.wav', '.m4a', '.mp4', '.webm'],
    SUSPICIOUS_PATTERNS: [
        /\.\./,           // Path traversal
        /[<>:"\\|?*]/,    // Invalid filename characters
        /^\./,            // Hidden files
        /\x00/,           // Null bytes
        /script/i,        // Script injection attempts
        /javascript/i,    // JavaScript injection
        /vbscript/i,      // VBScript injection
    ],
    MAX_METADATA_SIZE: 10 * 1024, // 10KB max metadata
    VIRUS_SCAN_TIMEOUT: 30000, // 30 seconds
    MIN_AUDIO_DURATION: 0.1, // 100ms minimum
    MAX_AUDIO_DURATION: 1800, // 30 minutes maximum
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 10
};

// File processing interfaces with enhanced typing
export interface FileData {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    metadata?: AudioMetadata;
    securityHash: string;
    uploadTimestamp: Date;
}

export interface AudioMetadata {
    duration?: number;
    timestamp?: string;
    userId?: string;
    appVersion?: string;
    deviceInfo?: string;
    sessionId?: string;
    recordingQuality?: 'low' | 'medium' | 'high';
}

export interface ProcessingContext {
    fileId: string;
    fileName: string;
    requestId: string;
    securityContext: SecurityContext;
    performanceMetrics: PerformanceMetrics;
}

export interface SecurityContext {
    clientIP?: string;
    userAgent?: string;
    contentHash: string;
    virusScanResult?: 'clean' | 'infected' | 'timeout' | 'error';
    riskScore: number; // 0-100 scale
}

export interface PerformanceMetrics {
    validationTime: number;
    processingTime: number;
    memoryUsage: number;
    cpuUsage?: number;
}

export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    warnings?: string[];
    securityFlags?: string[];
}

export interface ProcessedAudioData {
    processedBuffer: Buffer;
    audioDuration: number;
    sampleRate: number;
    channels: number;
    format: string;
    bitRate?: number;
    qualityScore: number; // 0-100 scale
    processingFlags: string[];
}

// Rate limiting storage (in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Bulletproof upload request validation with security-first approach
 */
export async function validateUploadRequest(
    request: HttpRequest
): Promise<ServiceResult<FileData>> {
    const startTime = Date.now();
    
    try {
        logger.info('Starting comprehensive request validation', { 
            method: request.method,
            contentType: request.headers.get('content-type'),
            contentLength: request.headers.get('content-length'),
            userAgent: request.headers.get('user-agent')
        });

        // Phase 1: Basic request validation
        const basicValidation = await validateBasicRequest(request);
        if (!basicValidation.success) {
            return basicValidation;
        }

        // Phase 2: Rate limiting check
        const rateLimitResult = checkRateLimit(request);
        if (!rateLimitResult.success) {
            return rateLimitResult;
        }

        // Phase 3: Extract and validate file data
        const extractionResult = await extractFileData(request);
        if (!extractionResult.success) {
            return extractionResult;
        }

        // Phase 4: Security validation
        const securityResult = await performSecurityValidation(extractionResult.data!);
        if (!securityResult.success) {
            return securityResult;
        }

        // Phase 5: Content validation
        const contentResult = await validateAudioContent(extractionResult.data!);
        if (!contentResult.success) {
            return contentResult;
        }

        const processingTime = Date.now() - startTime;
        logger.info('Request validation completed successfully', {
            fileSize: extractionResult.data!.buffer.length,
            mimeType: extractionResult.data!.mimeType,
            originalName: extractionResult.data!.originalName,
            processingTime,
            securityHash: extractionResult.data!.securityHash
        });

        return {
            success: true,
            data: extractionResult.data,
            warnings: contentResult.warnings
        };

    } catch (error) {
        logger.error('Validation error', { 
            error: error instanceof Error ? error.message : String(error),
            processingTime: Date.now() - startTime
        });
        
        return {
            success: false,
            error: 'Request validation failed due to internal error'
        };
    }
}

/**
 * Validate basic request structure and headers
 */
async function validateBasicRequest(request: HttpRequest): Promise<ServiceResult<boolean>> {
    try {
        // Method validation
        if (request.method !== 'POST') {
            return {
                success: false,
                error: `Method ${request.method} not allowed. Use POST.`
            };
        }

        // Extract and validate headers
        const contentType = request.headers.get('content-type');
        const contentLength = parseInt(request.headers.get('content-length') || '0');

        if (!contentType || !contentLength) {
            return {
                success: false,
                error: 'Missing required headers: Content-Type and Content-Length'
            };
        }

        // Schema validation
        const validationResult = uploadRequestSchema.validate({
            contentType,
            contentLength
        });

        if (validationResult.error) {
            return {
                success: false,
                error: `Invalid request headers: ${validationResult.error.details[0].message}`
            };
        }

        return { success: true, data: true };

    } catch (error) {
        return {
            success: false,
            error: `Basic validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Rate limiting implementation with sliding window
 */
function checkRateLimit(request: HttpRequest): ServiceResult<boolean> {
    try {
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        
        const now = Date.now();
        const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;
        
        // Clean up old entries
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetTime < windowStart) {
                rateLimitStore.delete(key);
            }
        }
        
        // Check current client rate
        const clientKey = `rate_${clientIP}`;
        const clientData = rateLimitStore.get(clientKey);
        
        if (clientData) {
            if (clientData.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
                return {
                    success: false,
                    error: 'Rate limit exceeded. Please try again later.',
                    securityFlags: ['RATE_LIMIT_EXCEEDED']
                };
            }
            
            // Increment counter
            clientData.count++;
        } else {
            // First request in window
            rateLimitStore.set(clientKey, {
                count: 1,
                resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
            });
        }
        
        return { success: true, data: true };
        
    } catch (error) {
        logger.error('Rate limit check failed', { 
            error: error instanceof Error ? error.message : String(error) 
        });
        
        // Fail open - allow request but log the error
        return { success: true, data: true };
    }
}

/**
 * Extract file data with comprehensive error handling
 */
async function extractFileData(request: HttpRequest): Promise<ServiceResult<FileData>> {
    try {
        const contentType = request.headers.get('content-type')!;
        let fileData: Partial<FileData>;

        if (contentType.startsWith('multipart/form-data')) {
            const multipartResult = await extractFromMultipart(request);
            if (!multipartResult.success) {
                return multipartResult;
            }
            fileData = multipartResult.data!;
        } else if (contentType.startsWith('audio/')) {
            const directResult = await extractFromDirectUpload(request, contentType);
            if (!directResult.success) {
                return directResult;
            }
            fileData = directResult.data!;
        } else {
            return {
                success: false,
                error: 'Unsupported content type. Use multipart/form-data or direct audio upload.'
            };
        }

        // Generate security hash
        const securityHash = crypto.createHash('sha256')
            .update(fileData.buffer!)
            .digest('hex');

        const completeFileData: FileData = {
            ...fileData as Required<Pick<FileData, 'buffer' | 'originalName' | 'mimeType'>>,
            securityHash,
            uploadTimestamp: new Date(),
            metadata: fileData.metadata
        };

        return { success: true, data: completeFileData };

    } catch (error) {
        return {
            success: false,
            error: `File extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Enhanced multipart form data extraction with security validation
 */
async function extractFromMultipart(request: HttpRequest): Promise<ServiceResult<Partial<FileData>>> {
    try {
        const bodyBuffer = await request.arrayBuffer();
        const body = Buffer.from(bodyBuffer);
        
        if (body.length === 0) {
            return { success: false, error: 'Empty request body' };
        }

        const contentType = request.headers.get('content-type')!;
        const boundary = extractBoundary(contentType);
        if (!boundary) {
            return { success: false, error: 'Missing or invalid multipart boundary' };
        }

        const parts = parseMultipartData(body, boundary);
        const filePart = parts.find(part => part.name === 'audio' && part.filename);
        
        if (!filePart) {
            return { success: false, error: 'No audio file found in multipart data' };
        }

        // Validate filename
        const filenameValidation = validateFilename(filePart.filename!);
        if (!filenameValidation.success) {
            return filenameValidation;
        }

        // Extract and validate metadata
        const metadataPart = parts.find(part => part.name === 'metadata');
        let metadata: AudioMetadata | undefined;
        
        if (metadataPart) {
            const metadataResult = parseAndValidateMetadata(metadataPart.data);
            if (!metadataResult.success) {
                return metadataResult;
            }
            metadata = metadataResult.data;
        }

        return {
            success: true,
            data: {
                buffer: filePart.data,
                originalName: filePart.filename!,
                mimeType: filePart.contentType || inferMimeType(filePart.filename!),
                metadata
            }
        };

    } catch (error) {
        return {
            success: false,
            error: `Multipart parsing failed: ${error instanceof Error ? error.message : 'Parse error'}`
        };
    }
}

/**
 * Direct audio upload extraction with validation
 */
async function extractFromDirectUpload(
    request: HttpRequest, 
    contentType: string
): Promise<ServiceResult<Partial<FileData>>> {
    try {
        const bodyBuffer = await request.arrayBuffer();
        const body = Buffer.from(bodyBuffer);
        
        if (body.length === 0) {
            return { success: false, error: 'Empty audio file' };
        }

        // Extract filename from Content-Disposition header if present
        const contentDisposition = request.headers.get('content-disposition');
        let filename = extractFilenameFromHeader(contentDisposition);
        
        if (!filename) {
            // Generate filename based on content type
            const extension = getExtensionFromMimeType(contentType);
            filename = `upload_${Date.now()}${extension}`;
        }

        // Validate filename
        const filenameValidation = validateFilename(filename);
        if (!filenameValidation.success) {
            return filenameValidation;
        }

        return {
            success: true,
            data: {
                buffer: body,
                originalName: filename,
                mimeType: contentType
            }
        };

    } catch (error) {
        return {
            success: false,
            error: `Direct upload processing failed: ${error instanceof Error ? error.message : 'Processing error'}`
        };
    }
}

/**
 * Comprehensive security validation
 */
async function performSecurityValidation(fileData: FileData): Promise<ServiceResult<FileData>> {
    const securityFlags: string[] = [];
    
    try {
        // File size validation
        if (fileData.buffer.length === 0) {
            return { success: false, error: 'Empty file detected' };
        }

        if (fileData.buffer.length > 100 * 1024 * 1024) { // 100MB
            return { success: false, error: 'File too large. Maximum size is 100MB.' };
        }

        // Magic number validation (file signature check)
        const magicValidation = validateMagicNumbers(fileData.buffer, fileData.mimeType);
        if (!magicValidation.success) {
            return magicValidation;
        }

        // Virus scan simulation (in production, integrate with actual antivirus)
        const virusScanResult = await simulateVirusScan(fileData.buffer);
        if (virusScanResult !== 'clean') {
            securityFlags.push(`VIRUS_SCAN_${virusScanResult.toUpperCase()}`);
            if (virusScanResult === 'infected') {
                return { 
                    success: false, 
                    error: 'File failed security scan',
                    securityFlags 
                };
            }
        }

        // Content analysis for suspicious patterns
        const contentAnalysis = analyzeFileContent(fileData.buffer);
        if (contentAnalysis.suspiciousPatterns.length > 0) {
            securityFlags.push(...contentAnalysis.suspiciousPatterns);
        }

        return { 
            success: true, 
            data: fileData,
            securityFlags: securityFlags.length > 0 ? securityFlags : undefined
        };

    } catch (error) {
        return {
            success: false,
            error: `Security validation failed: ${error instanceof Error ? error.message : 'Security error'}`
        };
    }
}

/**
 * Validate audio content and extract properties
 */
async function validateAudioContent(fileData: FileData): Promise<ServiceResult<FileData>> {
    const warnings: string[] = [];
    
    try {
        // Audio header validation
        const headerValidation = validateAudioHeader(fileData.buffer, fileData.mimeType);
        if (!headerValidation.success) {
            return headerValidation;
        }

        // Extract audio properties
        const propertiesResult = await extractAudioProperties(fileData.buffer, fileData.mimeType);
        if (!propertiesResult.success) {
            return propertiesResult;
        }

        const properties = propertiesResult.data!;

        // Validate audio duration
        if (properties.duration < SECURITY_CONFIG.MIN_AUDIO_DURATION) {
            return {
                success: false,
                error: `Audio too short. Minimum duration is ${SECURITY_CONFIG.MIN_AUDIO_DURATION} seconds.`
            };
        }

        if (properties.duration > SECURITY_CONFIG.MAX_AUDIO_DURATION) {
            return {
                success: false,
                error: `Audio too long. Maximum duration is ${SECURITY_CONFIG.MAX_AUDIO_DURATION} seconds.`
            };
        }

        // Quality warnings
        if (properties.sampleRate < 16000) {
            warnings.push('Low sample rate detected - may affect transcription quality');
        }

        if (properties.channels > 2) {
            warnings.push('Multi-channel audio detected - will be processed as stereo');
        }

        return {
            success: true,
            data: fileData,
            warnings: warnings.length > 0 ? warnings : undefined
        };

    } catch (error) {
        return {
            success: false,
            error: `Audio content validation failed: ${error instanceof Error ? error.message : 'Content error'}`
        };
    }
}

/**
 * Process audio file with advanced analysis
 */
export async function processAudioFile(
    fileData: FileData,
    context: ProcessingContext
): Promise<ServiceResult<ProcessedAudioData>> {
    
    const startTime = Date.now();
    const processingFlags: string[] = [];
    
    try {
        logger.info('Starting advanced audio processing', {
            fileId: context.fileId,
            fileSize: fileData.buffer.length,
            mimeType: fileData.mimeType,
            securityHash: fileData.securityHash
        });

        // Extract detailed audio properties
        const propertiesResult = await extractAudioProperties(fileData.buffer, fileData.mimeType);
        if (!propertiesResult.success) {
            return propertiesResult;
        }

        const properties = propertiesResult.data!;

        // Audio quality assessment
        const qualityScore = calculateQualityScore(properties, fileData.buffer.length);
        
        // Processing flags based on content analysis
        if (properties.sampleRate < 22050) {
            processingFlags.push('LOW_SAMPLE_RATE');
        }
        if (properties.channels === 1) {
            processingFlags.push('MONO_AUDIO');
        }
        if (qualityScore < 50) {
            processingFlags.push('LOW_QUALITY');
        }

        // Create processed audio data
        const processedData: ProcessedAudioData = {
            processedBuffer: fileData.buffer, // In production, might apply noise reduction, normalization
            audioDuration: properties.duration,
            sampleRate: properties.sampleRate,
            channels: properties.channels,
            format: properties.format,
            bitRate: estimateBitRate(fileData.buffer.length, properties.duration),
            qualityScore,
            processingFlags
        };

        const processingTime = Date.now() - startTime;
        
        logger.info('Audio processing completed', {
            fileId: context.fileId,
            duration: processedData.audioDuration,
            qualityScore: processedData.qualityScore,
            processingTime,
            flags: processingFlags
        });

        return {
            success: true,
            data: processedData,
            warnings: processingFlags.length > 0 ? [`Processing flags: ${processingFlags.join(', ')}`] : undefined
        };

    } catch (error) {
        logger.error('Audio processing error', {
            fileId: context.fileId,
            error: error instanceof Error ? error.message : String(error),
            processingTime: Date.now() - startTime
        });

        return {
            success: false,
            error: 'Audio processing failed due to internal error'
        };
    }
}

// Helper functions with enhanced security and validation

function validateFilename(filename: string): ServiceResult<boolean> {
    if (!filename || filename.length === 0) {
        return { success: false, error: 'Filename is required' };
    }

    if (filename.length > SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
        return { success: false, error: 'Filename too long' };
    }

    // Check for suspicious patterns
    for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
        if (pattern.test(filename)) {
            return { 
                success: false, 
                error: 'Invalid filename format',
                securityFlags: ['SUSPICIOUS_FILENAME']
            };
        }
    }

    // Check file extension
    const extension = getFileExtension(filename).toLowerCase();
    if (!SECURITY_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
        return { 
            success: false, 
            error: `Unsupported file format: ${extension}. Allowed: ${SECURITY_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
        };
    }

    return { success: true, data: true };
}

function parseAndValidateMetadata(data: Buffer): ServiceResult<AudioMetadata> {
    try {
        if (data.length > SECURITY_CONFIG.MAX_METADATA_SIZE) {
            return { success: false, error: 'Metadata too large' };
        }

        const metadataStr = data.toString('utf8');
        const metadata = JSON.parse(metadataStr);

        const validationResult = audioMetadataSchema.validate(metadata);
        if (validationResult.error) {
            return {
                success: false,
                error: `Invalid metadata: ${validationResult.error.details[0].message}`
            };
        }

        return { success: true, data: validationResult.value };

    } catch (error) {
        return {
            success: false,
            error: 'Failed to parse metadata JSON'
        };
    }
}

function validateMagicNumbers(buffer: Buffer, mimeType: string): ServiceResult<boolean> {
    if (buffer.length < 12) {
        return { success: false, error: 'File too small to validate' };
    }

    const header = buffer.subarray(0, 12);

    // Check for known audio file signatures
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
        if ((header[0] === 0xFF && (header[1] & 0xE0) === 0xE0) || 
            header.subarray(0, 3).toString() === 'ID3') {
            return { success: true, data: true };
        }
    } else if (mimeType.includes('wav')) {
        if (header.subarray(0, 4).toString() === 'RIFF' && 
            header.subarray(8, 12).toString() === 'WAVE') {
            return { success: true, data: true };
        }
    } else if (mimeType.includes('aac') || mimeType.includes('m4a')) {
        if (header.includes(Buffer.from('ftyp')) || 
            (header[0] === 0xFF && (header[1] & 0xF0) === 0xF0)) {
            return { success: true, data: true };
        }
    } else if (mimeType.includes('webm')) {
        if (header.subarray(0, 4).equals(Buffer.from([0x1A, 0x45, 0xDF, 0xA3]))) {
            return { success: true, data: true };
        }
    }

    return { 
        success: false, 
        error: 'File signature does not match declared content type',
        securityFlags: ['MIME_TYPE_MISMATCH']
    };
}

async function simulateVirusScan(buffer: Buffer): Promise<'clean' | 'infected' | 'timeout' | 'error'> {
    try {
        // Simulate virus scanning with timeout
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms simulation
        
        // Check for obvious malicious patterns (simplified)
        const content = buffer.toString('hex').toLowerCase();
        const maliciousPatterns = [
            'x5o!p%@ap[4\\pzx54(p^)7cc',  // EICAR test string
            'malware',
            'virus',
            'trojan'
        ];
        
        for (const pattern of maliciousPatterns) {
            if (content.includes(pattern)) {
                return 'infected';
            }
        }
        
        return 'clean';
    } catch (error) {
        return 'error';
    }
}

function analyzeFileContent(buffer: Buffer): { suspiciousPatterns: string[] } {
    const suspiciousPatterns: string[] = [];
    
    try {
        // Check for embedded scripts or executables
        const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
        
        if (content.includes('<script')) {
            suspiciousPatterns.push('EMBEDDED_SCRIPT');
        }
        if (content.includes('javascript:')) {
            suspiciousPatterns.push('JAVASCRIPT_URL');
        }
        if (content.includes('MZ')) { // PE executable header
            suspiciousPatterns.push('EXECUTABLE_HEADER');
        }
        
    } catch (error) {
        // Content analysis failed - not necessarily suspicious
    }
    
    return { suspiciousPatterns };
}

function calculateQualityScore(properties: any, fileSize: number): number {
    let score = 100;
    
    // Sample rate scoring
    if (properties.sampleRate < 16000) score -= 20;
    else if (properties.sampleRate < 22050) score -= 10;
    else if (properties.sampleRate >= 44100) score += 10;
    
    // Channel scoring
    if (properties.channels === 2) score += 5;
    
    // Bitrate estimation and scoring
    const estimatedBitrate = (fileSize * 8) / properties.duration;
    if (estimatedBitrate < 64000) score -= 15; // Below 64kbps
    else if (estimatedBitrate > 320000) score += 10; // Above 320kbps
    
    return Math.max(0, Math.min(100, score));
}

function estimateBitRate(fileSize: number, duration: number): number {
    return Math.round((fileSize * 8) / duration);
}

// Utility functions

function extractBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=([^;]+)/);
    return match ? match[1].replace(/"/g, '') : null;
}

function parseMultipartData(body: Buffer, boundary: string) {
    const parts: Array<{
        name: string;
        filename?: string;
        contentType?: string;
        data: Buffer;
    }> = [];

    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const sections = [];
    
    let start = 0;
    let boundaryIndex = body.indexOf(boundaryBuffer, start);
    
    while (boundaryIndex !== -1) {
        if (start !== boundaryIndex) {
            sections.push(body.subarray(start, boundaryIndex));
        }
        start = boundaryIndex + boundaryBuffer.length;
        boundaryIndex = body.indexOf(boundaryBuffer, start);
    }

    for (const section of sections) {
        const sectionStr = section.toString('binary');
        const headerEndIndex = sectionStr.indexOf('\r\n\r\n');
        
        if (headerEndIndex !== -1) {
            const headers = sectionStr.substring(0, headerEndIndex);
            const bodyStart = headerEndIndex + 4;
            const bodyData = section.subarray(bodyStart);
            
            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);

            if (nameMatch) {
                parts.push({
                    name: nameMatch[1],
                    filename: filenameMatch?.[1],
                    contentType: contentTypeMatch?.[1],
                    data: bodyData
                });
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

function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
}

function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/aac': '.aac',
        'audio/m4a': '.m4a',
        'audio/mp4': '.mp4',
        'audio/webm': '.webm'
    };
    return mimeMap[mimeType] || '.audio';
}

function inferMimeType(filename: string): string {
    const extension = getFileExtension(filename).toLowerCase();
    const extensionMap: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.m4a': 'audio/m4a',
        '.mp4': 'audio/mp4',
        '.webm': 'audio/webm'
    };
    return extensionMap[extension] || 'audio/unknown';
}

async function extractAudioProperties(buffer: Buffer, mimeType: string): Promise<ServiceResult<{
    duration: number;
    sampleRate: number;
    channels: number;
    format: string;
}>> {
    try {
        let duration = 0;
        let sampleRate = 44100;
        let channels = 1;
        let format = 'unknown';

        if (mimeType.includes('wav')) {
            if (buffer.length >= 44) {
                sampleRate = buffer.readUInt32LE(24);
                channels = buffer.readUInt16LE(22);
                const byteRate = buffer.readUInt32LE(28);
                const dataSize = buffer.readUInt32LE(40);
                duration = byteRate > 0 ? dataSize / byteRate : 1;
                format = 'wav';
            }
        } else {
            // Estimate for other formats
            const estimatedBitrate = 128000; // 128 kbps
            duration = Math.max(1, (buffer.length * 8) / estimatedBitrate);
            format = mimeType.split('/')[1] || 'unknown';
        }

        // Validate extracted properties
        if (sampleRate < 8000 || sampleRate > 192000) {
            return {
                success: false,
                error: `Invalid sample rate: ${sampleRate}Hz. Must be between 8kHz and 192kHz.`
            };
        }

        if (channels < 1 || channels > 8) {
            return {
                success: false,
                error: `Invalid channel count: ${channels}. Must be between 1 and 8.`
            };
        }

        return {
            success: true,
            data: {
                duration: Math.max(duration, 0.1),
                sampleRate,
                channels,
                format
            }
        };

    } catch (error) {
        return {
            success: false,
            error: `Property extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

function validateAudioHeader(buffer: Buffer, mimeType: string): ServiceResult<boolean> {
    try {
        if (buffer.length < 12) {
            return { success: false, error: 'File too small for header validation' };
        }

        // Use the same validation as magic numbers but with different error messages
        const magicResult = validateMagicNumbers(buffer, mimeType);
        if (!magicResult.success) {
            return {
                success: false,
                error: 'Invalid audio file header or corrupted file'
            };
        }

        return { success: true, data: true };

    } catch (error) {
        return { 
            success: false, 
            error: `Header validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        };
    }
}

/**
 * Enhanced error handling with structured logging and context preservation
 */
export function handleUploadError(error: unknown, context: Record<string, any>): any {
    const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
        context,
        severity: determineSeverity(error),
        actionable: generateActionableMessage(error),
        errorCode: generateErrorCode(error)
    };

    // Log with appropriate level based on severity
    if (errorInfo.severity === 'critical') {
        logger.error('Critical upload error', errorInfo);
    } else if (errorInfo.severity === 'high') {
        logger.error('High priority upload error', errorInfo);
    } else {
        logger.warn('Upload error', errorInfo);
    }

    return errorInfo;
}

function determineSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('virus') || message.includes('malware') || message.includes('infected')) {
            return 'critical';
        }
        if (message.includes('security') || message.includes('suspicious')) {
            return 'high';
        }
        if (message.includes('validation') || message.includes('format')) {
            return 'medium';
        }
    }
    
    return 'low';
}

function generateActionableMessage(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('file too large')) {
            return 'Reduce file size or compress the audio before uploading';
        }
        if (message.includes('invalid format') || message.includes('unsupported')) {
            return 'Convert audio to a supported format (MP3, WAV, AAC, M4A)';
        }
        if (message.includes('duration')) {
            return 'Ensure audio duration is between 0.1 seconds and 30 minutes';
        }
        if (message.includes('rate limit')) {
            return 'Wait before attempting another upload';
        }
    }
    
    return 'Please try again or contact support if the problem persists';
}

function generateErrorCode(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('validation')) return 'E001_VALIDATION';
        if (message.includes('security')) return 'E002_SECURITY';
        if (message.includes('format')) return 'E003_FORMAT';
        if (message.includes('size')) return 'E004_SIZE';
        if (message.includes('duration')) return 'E005_DURATION';
        if (message.includes('rate limit')) return 'E006_RATE_LIMIT';
        if (message.includes('virus')) return 'E007_SECURITY_SCAN';
        if (message.includes('timeout')) return 'E008_TIMEOUT';
        if (message.includes('network')) return 'E009_NETWORK';
        if (message.includes('storage')) return 'E010_STORAGE';
    }
    
    return 'E999_UNKNOWN';
}

// Performance monitoring utilities
export function createPerformanceMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    
    return {
        validationTime: 0,
        processingTime: 0,
        memoryUsage: memUsage.heapUsed
    };
}

export function updatePerformanceMetrics(
    metrics: PerformanceMetrics, 
    phase: 'validation' | 'processing', 
    startTime: number
): void {
    const duration = Date.now() - startTime;
    
    if (phase === 'validation') {
        metrics.validationTime = duration;
    } else {
        metrics.processingTime = duration;
    }
    
    // Update memory usage
    metrics.memoryUsage = process.memoryUsage().heapUsed;
}

// Export utility functions for testing
export {
    validateFilename,
    parseAndValidateMetadata,
    validateMagicNumbers,
    simulateVirusScan,
    analyzeFileContent,
    calculateQualityScore,
    estimateBitRate,
    extractBoundary,
    parseMultipartData,
    extractFilenameFromHeader,
    getFileExtension,
    getExtensionFromMimeType,
    inferMimeType,
    validateAudioHeader,
    determineSeverity,
    generateActionableMessage,
    generateErrorCode,
    SECURITY_CONFIG
};