"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioUpload = audioUpload;
exports.healthCheck = healthCheck;
const functions_1 = require("@azure/functions");
const audioProcessingService_1 = require("../services/audioProcessingService");
const logger_1 = require("../utils/logger");
/**
 * Azure Function for handling audio file uploads with comprehensive error handling
 * Endpoint: POST /api/audioUpload
 *
 * This function implements defensive programming patterns with:
 * - Request validation
 * - Audio processing
 * - Comprehensive error handling
 * - Structured logging
 */
async function audioUpload(request, context) {
    // Generate unique request ID for tracking
    const requestId = context.invocationId;
    const logger = (0, logger_1.createRequestLogger)(requestId, {
        functionName: 'audioUpload',
        method: request.method
    });
    logger.info('Audio upload request received', {
        url: request.url,
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length')
    });
    try {
        // Step 1: Validate and extract file data
        logger.info('Starting file validation');
        const validationResult = await (0, audioProcessingService_1.validateUploadRequest)(request);
        if (!validationResult.success) {
            logger.warn('File validation failed', {
                error: validationResult.error
            });
            return {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                },
                body: JSON.stringify({
                    success: false,
                    error: validationResult.error,
                    requestId
                })
            };
        }
        const fileData = validationResult.data;
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        logger.info('File validation successful', {
            fileId,
            fileSize: fileData.buffer.length,
            originalName: fileData.originalName,
            mimeType: fileData.mimeType
        });
        // Step 2: Process audio file
        logger.info('Starting audio processing', { fileId });
        const processingContext = {
            fileId,
            fileName: fileData.originalName,
            requestId,
            context: {
                uploadTimestamp: new Date().toISOString(),
                userAgent: request.headers.get('user-agent') || 'unknown',
                clientIP: request.headers.get('x-forwarded-for') || 'unknown'
            }
        };
        const processingResult = await (0, audioProcessingService_1.processAudioFile)(fileData, processingContext);
        if (!processingResult.success) {
            logger.error('Audio processing failed', {
                fileId,
                error: processingResult.error
            });
            return {
                status: 422,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                },
                body: JSON.stringify({
                    success: false,
                    error: processingResult.error,
                    fileId,
                    requestId
                })
            };
        }
        const processedAudio = processingResult.data;
        logger.info('Audio processing completed successfully', {
            fileId,
            duration: processedAudio.audioDuration,
            sampleRate: processedAudio.sampleRate,
            channels: processedAudio.channels
        });
        // Step 3: Return success response with audio metadata
        const responseData = {
            success: true,
            fileId,
            requestId,
            metadata: {
                originalName: fileData.originalName,
                mimeType: fileData.mimeType,
                fileSize: fileData.buffer.length,
                duration: processedAudio.audioDuration,
                sampleRate: processedAudio.sampleRate,
                channels: processedAudio.channels,
                format: processedAudio.format,
                uploadTimestamp: new Date().toISOString()
            },
            // Include any client metadata that was provided
            ...(fileData.metadata && { clientMetadata: fileData.metadata })
        };
        logger.info('Upload completed successfully', {
            fileId,
            responseSize: JSON.stringify(responseData).length
        });
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-File-ID': fileId
            },
            body: JSON.stringify(responseData)
        };
    }
    catch (error) {
        // Handle unexpected errors with comprehensive logging
        const errorInfo = (0, audioProcessingService_1.handleUploadError)(error, {
            requestId,
            functionName: 'audioUpload',
            timestamp: new Date().toISOString()
        });
        logger.error('Unexpected error in audio upload', errorInfo);
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            body: JSON.stringify({
                success: false,
                error: 'Internal server error occurred during upload processing',
                requestId,
                timestamp: new Date().toISOString()
            })
        };
    }
}
/**
 * Health check endpoint for monitoring
 */
async function healthCheck(_request, context) {
    const requestId = context.invocationId;
    const logger = (0, logger_1.createRequestLogger)(requestId, { functionName: 'healthCheck' });
    try {
        logger.info('Health check requested');
        // Basic health checks
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId,
            version: '1.0.0',
            environment: 'development', // Will be set by deployment
            checks: {
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        };
        logger.info('Health check completed', {
            requestId,
            status: 'healthy',
            uptime: process.uptime()
        });
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            body: JSON.stringify(healthStatus)
        };
    }
    catch (error) {
        logger.error('Health check failed', {
            requestId,
            error: error instanceof Error ? error.message : String(error)
        });
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            body: JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                requestId,
                error: 'Health check failed'
            })
        };
    }
}
// Register functions with Azure Functions runtime
functions_1.app.http('audioUpload', {
    methods: ['POST'],
    authLevel: 'anonymous', // In production, use 'function' or 'admin'
    route: 'audioUpload',
    handler: audioUpload
});
functions_1.app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: healthCheck
});
//# sourceMappingURL=audioUploadV2.js.map