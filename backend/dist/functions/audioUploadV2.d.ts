import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
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
export declare function audioUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
/**
 * Health check endpoint for monitoring
 */
export declare function healthCheck(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;
//# sourceMappingURL=audioUploadV2.d.ts.map