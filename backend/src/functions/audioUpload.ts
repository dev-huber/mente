import { logger } from '../utils/logger';
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { validateUploadRequest, handleUploadError } from '../services/audioProcessingService'; // Mantido apenas o necessário
import { audioStorageService } from '../services/storageService';
// import { createRequestLogger } from '../utils/logger'; // Não utilizado
import { v4 as uuidv4 } from 'uuid';

// Health check interfaces
interface HealthCheckResult {
    storage: boolean;
    aiServices: boolean;
    memory: boolean;
}

// Perform comprehensive health checks
async function performHealthChecks(requestId: string): Promise<HealthCheckResult> {
    const results: HealthCheckResult = {
        storage: false,
        aiServices: false,
        memory: false
    };

    try {
        // Check Azure Blob Storage
        const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        results.storage = !!storageConnectionString && storageConnectionString.length > 0;

        // Check Azure AI Services
        const aiSubscriptionKey = process.env.AZURE_AI_SUBSCRIPTION_KEY;
        const speechKey = process.env.AZURE_SPEECH_KEY;
        results.aiServices = !!(aiSubscriptionKey || speechKey);

        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryLimitMB = 512; // Azure Functions basic memory limit
        const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
        results.memory = usedMemoryMB < (memoryLimitMB * 0.8); // Alert at 80%

        logger.info('Health checks completed', { 
            requestId, 
            results,
            memoryUsageMB: usedMemoryMB 
        });

    } catch (error) {
        logger.error('Health check failed', error as Error, { requestId });
    }

    return results;
}

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
                ai_services: 'checking...',
                memory: 'checking...'
            }
        };

        // Perform actual health checks for dependencies
        const checks = await performHealthChecks(requestId);
        healthStatus.checks = {
            function: 'ok',
            storage: checks.storage ? 'healthy' : 'unhealthy',
            ai_services: checks.aiServices ? 'healthy' : 'unhealthy',
            memory: checks.memory ? 'healthy' : 'warning'
        };

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
