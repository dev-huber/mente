/**
 * Circuit Breaker Pattern Implementation
 * - Prevents cascade failures in distributed systems
 * - Automatic failure detection and recovery
 * - Multiple failure thresholds and recovery strategies
 * - Real-time monitoring and metrics
 * - Service-specific configuration
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    requestTimeout: number;
    successThreshold: number;
    monitoringWindow: number;
    fallbackEnabled: boolean;
}
interface CircuitMetrics {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    consecutiveFailures: number;
    lastFailureTime?: number;
    lastSuccessTime?: number;
    state: CircuitState;
    stateChangedAt: number;
    averageResponseTime: number;
}
interface ServiceCall<T> {
    serviceFunction: () => Promise<T>;
    fallbackFunction?: () => Promise<T>;
    timeout?: number;
}
interface CircuitBreakerResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    fromFallback: boolean;
    circuitState: CircuitState;
    responseTime: number;
}
export declare class CircuitBreaker {
    private serviceName;
    private config;
    private metrics;
    private logger;
    private responseTimesWindow;
    constructor(serviceName: string, customConfig?: Partial<CircuitBreakerConfig>);
    /**
     * Execute a service call with circuit breaker protection
     */
    execute<T>(serviceCall: ServiceCall<T>): Promise<CircuitBreakerResult<T>>;
    /**
     * Check if the circuit should allow the request
     */
    private shouldAllowRequest;
    /**
     * Execute service call with timeout protection
     */
    private executeWithTimeout;
    /**
     * Handle requests when circuit is open
     */
    private handleOpenCircuit;
    /**
     * Execute fallback function
     */
    private executeFallback;
    /**
     * Record successful service call
     */
    private recordSuccess;
    /**
     * Record failed service call
     */
    private recordFailure;
    /**
     * Check if circuit should be opened
     */
    private shouldOpenCircuit;
    /**
     * Get recent failure rate within monitoring window
     */
    private getRecentFailureRate;
    /**
     * Get recent successes for HALF_OPEN state evaluation
     */
    private getRecentSuccesses;
    /**
     * Update average response time
     */
    private updateAverageResponseTime;
    /**
     * Transition circuit to OPEN state
     */
    private transitionToOpen;
    /**
     * Transition circuit to HALF_OPEN state
     */
    private transitionToHalfOpen;
    /**
     * Transition circuit to CLOSED state
     */
    private transitionToClosed;
    /**
     * Get current circuit breaker metrics
     */
    getMetrics(): CircuitMetrics;
    /**
     * Reset circuit breaker (for testing/admin purposes)
     */
    reset(): void;
}
export declare class CircuitBreakerRegistry {
    private static instance;
    private circuits;
    private logger;
    private constructor();
    static getInstance(): CircuitBreakerRegistry;
    /**
     * Get or create circuit breaker for service
     */
    getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker;
    /**
     * Get all circuit breaker metrics
     */
    getAllMetrics(): Record<string, CircuitMetrics>;
    /**
     * Reset all circuit breakers
     */
    resetAll(): void;
}
export declare const circuitBreakerRegistry: CircuitBreakerRegistry;
export {};
//# sourceMappingURL=circuitBreakerService.d.ts.map