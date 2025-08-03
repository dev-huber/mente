"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioUpload = audioUpload;
exports.healthCheck = healthCheck;
const logger_1 = require("../utils/logger");
const functions_1 = require("@azure/functions");
const audioProcessingService_1 = require("../services/audioProcessingService"); // Mantido apenas o necessário
const storageService_1 = require("../services/storageService");
// import { createRequestLogger } from '../utils/logger'; // Não utilizado
const uuid_1 = require("uuid");
/**
 * Defensive Azure Function for audio upload with comprehensive error handling
 * Implements fail-fast principles with graceful degradation
 */
async function audioUpload(request) {
    var _a, _b, _c, _d;
    const requestId = (0, uuid_1.v4)();
    const startTime = Date.now();
    // Structured logging context
    const logContext = {
        requestId,
        functionName: 'audioUpload',
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown'
    };
    logger_1.logger.info('Audio upload request started', logContext);
    try {
        // Pre-processing validations - fail fast
        const validationResult = await (0, audioProcessingService_1.validateUploadRequest)(request);
        if (!validationResult.success) {
            logger_1.logger.warn('Request validation failed', {
                ...logContext,
                error: validationResult.error,
                duration: Date.now() - startTime
            });
            return {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                },
                jsonBody: {
                    success: false,
                    error: {
                        code: 'VALIDATION_FAILED',
                        message: validationResult.error,
                        requestId
                    }
                }
            };
        }
        // Extract file data from request
        const fileData = validationResult.data;
        if (!fileData) {
            throw new Error('File data extraction failed after validation');
        }
        // Upload real para Azure Blob Storage
        const metadata = {
            originalName: fileData.originalName,
            uploadTimestamp: new Date().toISOString(),
            fileId: requestId,
            contentType: fileData.mimeType,
            fileSize: fileData.buffer.length
        };
        const uploadResult = await storageService_1.audioStorageService.uploadAudioFile(fileData.buffer, fileData.originalName, metadata, fileData.mimeType);
        const duration = Date.now() - startTime;
        if (!uploadResult.success) {
            logger_1.logger.error('Blob upload failed', {
                ...logContext,
                error: uploadResult.error,
                duration
            });
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                },
                jsonBody: {
                    success: false,
                    error: {
                        code: 'BLOB_UPLOAD_FAILED',
                        message: uploadResult.error,
                        requestId
                    }
                }
            };
        }
        logger_1.logger.info('Audio upload completed com sucesso (Azure Blob)', {
            ...logContext,
            blobUrl: (_a = uploadResult.data) === null || _a === void 0 ? void 0 : _a.blobUrl,
            blobName: (_b = uploadResult.data) === null || _b === void 0 ? void 0 : _b.blobName,
            duration
        });
        return {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            jsonBody: {
                success: true,
                data: {
                    id: requestId,
                    status: 'uploaded',
                    timestamp: new Date().toISOString(),
                    blobUrl: (_c = uploadResult.data) === null || _c === void 0 ? void 0 : _c.blobUrl,
                    blobName: (_d = uploadResult.data) === null || _d === void 0 ? void 0 : _d.blobName,
                    metadata: {
                        fileSize: fileData.buffer.length,
                        mimeType: fileData.mimeType,
                        processingTime: duration
                    }
                }
            }
        };
    }
    catch (error) {
        // Global error handler
        const duration = Date.now() - startTime;
        const errorDetails = (0, audioProcessingService_1.handleUploadError)(error, { ...logContext, duration });
        logger_1.logger.error('Unexpected error in audio upload', {
            ...logContext,
            error: errorDetails,
            duration
        });
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId
            },
            jsonBody: {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred. Please try again.',
                    requestId
                }
            }
        };
    }
}
/**
 * Health check endpoint for monitoring
 */
async function healthCheck() {
    const requestId = (0, uuid_1.v4)();
    try {
        // Basic health checks
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId,
            checks: {
                function: 'ok',
                storage: 'checking...',
                ai_services: 'checking...'
            }
        };
        // TODO: Add actual health checks for dependencies
        // - Azure Blob Storage connectivity
        // - Azure AI Services availability
        // - Memory usage
        // - Function execution metrics
        logger_1.logger.info('Health check completed', { requestId, status: 'healthy' });
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            jsonBody: healthStatus
        };
    }
    catch (error) {
        logger_1.logger.error('Health check failed', { requestId, error: error instanceof Error ? error.message : String(error) });
        return {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            jsonBody: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                requestId,
                error: 'Health check failed'
            }
        };
    }
}
/**
 * Get file extension from filename
 */
// Removed unused function getFileExtension
// Register functions
functions_1.app.http('audioUpload', {
    methods: ['POST'],
    route: 'upload/audio',
    authLevel: 'anonymous', // In production, use 'function' or 'admin'
    handler: audioUpload
});
functions_1.app.http('healthCheck', {
    methods: ['GET'],
    route: 'health',
    authLevel: 'anonymous',
    handler: healthCheck
});
//# sourceMappingURL=audioUpload.js.map