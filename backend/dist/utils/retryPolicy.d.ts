/**
 * Retry Policy com exponential backoff
 * Implementa retry inteligente para operações falíveis
 */
export interface RetryPolicyOptions {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    factor: number;
    shouldRetry?: (error: any) => boolean;
}
export declare class RetryPolicy {
    private options;
    constructor(options: RetryPolicyOptions);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private sleep;
}
//# sourceMappingURL=retryPolicy.d.ts.map