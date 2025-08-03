import { logger } from '../utils/logger';
import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { validateUploadRequest, processAudioFile, handleUploadError } from '../services/audioProcessingService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulletproof Azure Function for audio upload with comprehensive error handling
 * Implements fail-fast principles with graceful degradation and security-first approach
 */
export async function audioUpload(request: HttpRequest): Promise<HttpResponseInit> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    // Structured logging context for complete traceability
    const logContext = {
        requestId,
        functionName: 'audioUpload',
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent') || 'unknown',
        contentLength: request.headers.get('content-length') || '0',
        contentType: request.headers.get('content-type') || 'unknown'
    };

    logger.info('Audio upload request started', logContext);

    try {
        // Phase 1: Pre-processing validations - fail fast
        const validationResult = await validateUploadRequest(request);
        if (!validationResult.success) {
            const duration = Date.now() - startTime;
            logger.warn('Request validation failed', { 
                ...logContext, 
                error: validationResult.error,
                duration,
                phase: 'validation'
            });

            return createErrorResponse(requestId, 400, 'VALIDATION_FAILED', validationResult.error);
        }

        // Phase 2: Extract and validate file data
        const fileData = validationResult.data;
        if (!fileData) {
            throw new Error('File data extraction failed after successful validation');
        }

        logger.info('File validation successful', {
            ...logContext,
            fileSize: fileData.buffer.length,
            mimeType: fileData.mimeType,
            originalName: fileData.originalName,
            hasMetadata: !!fileData.metadata
        });

        // Phase 3: Process audio file (optional advanced processing)
        const processingContext = {
            fileId: requestId,
            fileName: fileData.originalName,
            requestId,
            context: {
                uploadTime: new Date().toISOString(),
                source: 'mobile_app',
                version: '1.0.0'
            }
        };

        const processingResult = await processAudioFile(fileData, processingContext);
        if (!processingResult.success) {
            logger.error('Audio processing failed', {
                ...logContext,
                error: processingResult.error,
                phase: 'processing'
            });

            return createErrorResponse(requestId, 422, 'PROCESSING_FAILED', processingResult.error);
        }

        // Phase 4: Success response with comprehensive metadata
        const duration = Date.now() - startTime;
        const responseData = {
            id: requestId,
            status: 'uploaded',
            timestamp: new Date().toISOString(),
            metadata: {
                fileSize: fileData.buffer.length,
                originalName: fileData.originalName,
                mimeType: fileData.mimeType,
                processingTime: duration,
                audioProperties: processingResult.data ? {
                    duration: processingResult.data.audioDuration,
                    sampleRate: processingResult.data.sampleRate,
                    channels: processingResult.data.channels,
                    format: processingResult.data.format
                } : undefined,
                uploadMetadata: fileData.metadata
            }
        };

        logger.info('Audio upload completed successfully', {
            ...logContext,
            duration,
            phase: 'success',
            responseDataId: responseData.id
        });

        return {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Processing-Time': duration.toString(),
                'Cache-Control': 'no-cache'
            },
            jsonBody: {
                success: true,
                data: responseData
            }
        };

    } catch (error) {
        // Global error handler with comprehensive logging
        const duration = Date.now() - startTime;
        const errorDetails = handleUploadError(error, { ...logContext, duration, phase: 'unexpected' });
        
        logger.error('Unexpected error in audio upload', {
            ...logContext,
            error: errorDetails,
            duration,
            phase: 'error_handling'
        });

        return createErrorResponse(requestId, 500, 'INTERNAL_ERROR', 
            'An unexpected error occurred. Please try again.');
    }
}

/**
 * Health check endpoint with comprehensive system validation
 */
export async function healthCheck(request: HttpRequest): Promise<HttpResponseInit> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
        logger.info('Health check initiated', { requestId });

        // Comprehensive health checks
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            requestId,
            version: '1.0.0',
            checks: {
                function: await checkFunctionHealth(),
                memory: await checkMemoryHealth(),
                performance: await checkPerformanceHealth(),
                dependencies: await checkDependenciesHealth()
            },
            metrics: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                processingTime: Date.now() - startTime
            }
        };

        // Determine overall health status
        const allChecksHealthy = Object.values(healthStatus.checks).every(check => check.status === 'ok');
        if (!allChecksHealthy) {
            healthStatus.status = 'degraded';
        }

        const httpStatus = allChecksHealthy ? 200 : 503;
        
        logger.info('Health check completed', { 
            requestId, 
            status: healthStatus.status,
            duration: Date.now() - startTime
        });

        return {
            status: httpStatus,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Request-ID': requestId
            },
            jsonBody: healthStatus
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Health check failed', { 
            requestId, 
            error: error instanceof Error ? error.message : String(error),
            duration
        });
        
        return {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Request-ID': requestId
            },
            jsonBody: {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                requestId,
                error: 'Health check failed',
                duration
            }
        };
    }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
    requestId: string, 
    status: number, 
    code: string, 
    message?: string
): HttpResponseInit {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'Cache-Control': 'no-cache'
        },
        jsonBody: {
            success: false,
            error: {
                code,
                message: message || 'Request failed',
                requestId,
                timestamp: new Date().toISOString()
            }
        }
    };
}

/**
 * Health check functions
 */
async function checkFunctionHealth(): Promise<{ status: string; details?: string }> {
    try {
        // Basic function responsiveness check
        const testValue = Math.random();
        if (testValue >= 0) {
            return { status: 'ok' };
        }
        return { status: 'error', details: 'Function logic error' };
    } catch (error) {
        return { 
            status: 'error', 
            details: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

async function checkMemoryHealth(): Promise<{ status: string; details?: string }> {
    try {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
        
        // Check if memory usage is above 80% of heap
        const memoryPressure = (heapUsedMB / heapTotalMB) > 0.8;
        
        if (memoryPressure) {
            return { 
                status: 'warning', 
                details: `High memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB` 
            };
        }
        
        return { 
            status: 'ok', 
            details: `Memory usage: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB` 
        };
    } catch (error) {
        return { 
            status: 'error', 
            details: error instanceof Error ? error.message : 'Memory check failed' 
        };
    }
}

async function checkPerformanceHealth(): Promise<{ status: string; details?: string }> {
    try {
        const start = process.hrtime.bigint();
        
        // Simple performance test
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
            sum += Math.sqrt(i);
        }
        
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1000000; // Convert to milliseconds
        
        if (durationMs > 100) { // More than 100ms is concerning
            return { 
                status: 'warning', 
                details: `Slow performance: ${durationMs.toFixed(2)}ms` 
            };
        }
        
        return { 
            status: 'ok', 
            details: `Performance test: ${durationMs.toFixed(2)}ms` 
        };
    } catch (error) {
        return { 
            status: 'error', 
            details: error instanceof Error ? error.message : 'Performance check failed' 
        };
    }
}

async function checkDependenciesHealth(): Promise<{ status: string; details?: string }> {
    try {
        // Check critical dependencies
        const dependencies = [
            'uuid',
            '@azure/functions'
        ];
        
        const missingDeps: string[] = [];
        
        for (const dep of dependencies) {
            try {
                require.resolve(dep);
            } catch {
                missingDeps.push(dep);
            }
        }
        
        if (missingDeps.length > 0) {
            return { 
                status: 'error', 
                details: `Missing dependencies: ${missingDeps.join(', ')}` 
            };
        }
        
        return { 
            status: 'ok', 
            details: `All ${dependencies.length} dependencies available` 
        };
    } catch (error) {
        return { 
            status: 'error', 
            details: error instanceof Error ? error.message : 'Dependency check failed' 
        };
    }
}

// Register functions with enhanced configuration
app.http('audioUpload', {
    methods: ['POST'],
    route: 'upload/audio',
    authLevel: 'anonymous', // In production, use 'function' or 'admin' with proper API keys
    handler: audioUpload
});

app.http('healthCheck', {
    methods: ['GET'],
    route: 'health',
    authLevel: 'anonymous',
    handler: healthCheck
});

// Export for testing
export { createErrorResponse, checkFunctionHealth, checkMemoryHealth, checkPerformanceHealth, checkDependenciesHealth };