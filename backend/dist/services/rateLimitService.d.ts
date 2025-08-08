/**
 * Distributed Rate Limiting Service
 * - Redis-based distributed rate limiting
 * - Multiple rate limiting algorithms (sliding window, token bucket)
 * - User and IP-based limiting
 * - Comprehensive error handling and fallbacks
 * - Real-time metrics and monitoring
 */
interface RateLimitConfig {
    redis?: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
    fallbackToMemory: boolean;
    defaultLimits: {
        requests: number;
        windowMs: number;
        burstAllowance: number;
    };
    keyPrefix: string;
}
interface RateLimitRequest {
    identifier: string;
    action: string;
    weight?: number;
}
interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
    metadata: {
        algorithm: 'sliding-window' | 'token-bucket' | 'memory-fallback';
        hitCount: number;
        windowStart: Date;
    };
}
export declare class RateLimitService {
    private logger;
    private config;
    private redisClient;
    private memoryStore;
    private isRedisConnected;
    constructor(config?: RateLimitConfig);
    /**
     * Initialize Redis connection with error handling
     */
    private initializeRedis;
    /**
     * Check rate limit for a request
     */
    checkRateLimit(request: RateLimitRequest): Promise<RateLimitResult>;
    /**
     * Redis-based sliding window rate limiting
     */
    private checkRedisRateLimit;
    /**
     * Memory-based rate limiting fallback
     */
    private checkMemoryRateLimit;
    /**
     * Increment rate limit counter (for successful requests)
     */
    incrementCounter(request: RateLimitRequest): Promise<void>;
    /**
     * Get current rate limit status without incrementing
     */
    getRateLimitStatus(identifier: string, action: string): Promise<RateLimitResult>;
    /**
     * Reset rate limit for specific identifier and action
     */
    resetRateLimit(identifier: string, action: string): Promise<void>;
    /**
     * Get rate limiting metrics
     */
    getMetrics(): Promise<{
        totalKeys: number;
        activeWindows: number;
        redisConnected: boolean;
        memoryStoreSize: number;
    }>;
    /**
     * Generate Redis key for rate limiting
     */
    private generateKey;
    /**
     * Cleanup expired entries from memory store
     */
    private cleanupMemoryStore;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
export declare const rateLimitService: RateLimitService;
export {};
//# sourceMappingURL=rateLimitService.d.ts.map