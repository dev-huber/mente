import { HttpRequest, HttpResponseInit } from '@azure/functions';
/**
 * Defensive Azure Function for audio upload with comprehensive error handling
 * Implements fail-fast principles with graceful degradation
 */
export declare function audioUpload(request: HttpRequest): Promise<HttpResponseInit>;
/**
 * Health check endpoint for monitoring
 */
export declare function healthCheck(): Promise<HttpResponseInit>;
//# sourceMappingURL=audioUpload.d.ts.map