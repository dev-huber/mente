/**
 * Circuit Breaker pattern implementation
 * Protege contra falhas em cascata e permite recuperação graciosa
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
    onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}
export declare class CircuitBreaker {
    private options;
    private state;
    private failureCount;
    private lastFailureTime?;
    private successCount;
    private nextAttempt?;
    constructor(options: CircuitBreakerOptions);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    private transitionTo;
    isOpen(): boolean;
    getState(): CircuitState;
}
//# sourceMappingURL=circuitBreaker.d.ts.map