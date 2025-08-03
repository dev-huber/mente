import { logger } from '../utils/logger';
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { validateUploadRequest, processAudioFile, handleUploadError } from '../services/audioProcessingService'; // Mantido apenas o necessário
import { audioStorageService } from '../services/storageService';
// import { createRequestLogger } from '../utils/logger'; // Não utilizado
import { v4 as uuidv4 } from 'uuid';

/**
 * Defensive Azure Function for audio upload with comprehensive error handling
 * Implements fail-fast principles with graceful degradation
 */
export async function audioUpload(request: HttpRequest): Promise<HttpResponseInit> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    // Structured logging context
    const logContext = {
        requestId,
        functionName: 'audioUpload',
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown'
    };
    logger.info('Audio upload request started', logContext);

    try {
        // Pre-processing validations - fail fast
        const validationResult = await validateUploadRequest(request);
        if (!validationResult.success) {
            logger.warn('Request validation failed', { 
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
        const uploadResult = await audioStorageService.uploadAudioFile(
            fileData.buffer,
            fileData.originalName,
            metadata,
            fileData.mimeType
        );

        const duration = Date.now() - startTime;
        if (!uploadResult.success) {
            logger.error('Blob upload failed', {
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

        logger.info('Audio upload completed com sucesso (Azure Blob)', {
            ...logContext,
            blobUrl: uploadResult.data?.blobUrl,
            blobName: uploadResult.data?.blobName,
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
                    blobUrl: uploadResult.data?.blobUrl,
                    blobName: uploadResult.data?.blobName,
                    metadata: {
                        fileSize: fileData.buffer.length,
                        mimeType: fileData.mimeType,
                        processingTime: duration
                    }
                }
            }
        };
    } catch (error) {
        // Global error handler
        const duration = Date.now() - startTime;
        const errorDetails = handleUploadError(error, { ...logContext, duration });
        logger.error('Unexpected error in audio upload', {
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
export async function healthCheck(): Promise<HttpResponseInit> {
    const requestId = uuidv4();
    
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

        logger.info('Health check completed', { requestId, status: 'healthy' });

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            jsonBody: healthStatus
        };

    } catch (error) {
        logger.error('Health check failed', { requestId, error: error instanceof Error ? error.message : String(error) });
        
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
app.http('audioUpload', {
    methods: ['POST'],
    route: 'upload/audio',
    authLevel: 'anonymous', // In production, use 'function' or 'admin'
    handler: audioUpload
});

app.http('healthCheck', {
    methods: ['GET'],
    route: 'health',
    authLevel: 'anonymous',
    handler: healthCheck
});
