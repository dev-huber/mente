"use strict";
/**
 * Distributed Rate Limiting Service
 * - Redis-based distributed rate limiting
 * - Multiple rate limiting algorithms (sliding window, token bucket)
 * - User and IP-based limiting
 * - Comprehensive error handling and fallbacks
 * - Real-time metrics and monitoring
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitService = exports.RateLimitService = void 0;
const logger_1 = require("../utils/logger");
// Action-specific rate limits
const ACTION_LIMITS = {
    'upload': { requests: 10, windowMs: 60000, weight: 5 }, // 10 uploads per minute
    'auth': { requests: 5, windowMs: 300000, weight: 1 }, // 5 auth attempts per 5 minutes
    'analyze': { requests: 20, windowMs: 60000, weight: 3 }, // 20 analysis per minute
    'health': { requests: 100, windowMs: 60000, weight: 1 }, // 100 health checks per minute
    'default': { requests: 30, windowMs: 60000, weight: 1 }, // 30 requests per minute
};
class RateLimitService {
    logger;
    config;
    redisClient = null;
    memoryStore = new Map();
    isRedisConnected = false;
    constructor(config = {
        fallbackToMemory: true,
        defaultLimits: {
            requests: 30,
            windowMs: 60000,
            burstAllowance: 5
        },
        keyPrefix: 'rl:'
    }) {
        this.config = config;
        this.logger = (0, logger_1.createLogger)('RateLimitService');
        this.initializeRedis();
    }
    /**
     * Initialize Redis connection with error handling
     */
    async initializeRedis() {
        if (!this.config.redis) {
            this.logger.info('Redis config not provided, using memory fallback');
            return;
        }
        try {
            // Dynamic import for Redis (optional dependency)
            const Redis = await Promise.resolve().then(() => __importStar(require('ioredis'))).then(m => m.default).catch(() => null);
            if (!Redis) {
                this.logger.warn('Redis module not available, using memory fallback');
                return;
            }
            this.redisClient = new Redis({
                host: this.config.redis.host,
                port: this.config.redis.port,
                password: this.config.redis.password,
                db: this.config.redis.db || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
            });
            this.redisClient.on('connect', () => {
                this.isRedisConnected = true;
                this.logger.info('Redis connected successfully');
            });
            this.redisClient.on('error', (error) => {
                this.isRedisConnected = false;
                this.logger.error('Redis connection error', { error: error.message });
            });
            await this.redisClient.connect();
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis', { error: error.message });
            this.isRedisConnected = false;
        }
    }
    /**
     * Check rate limit for a request
     */
    async checkRateLimit(request) {
        try {
            const limits = ACTION_LIMITS[request.action] || ACTION_LIMITS.default;
            const weight = request.weight || limits.weight;
            const key = this.generateKey(request.identifier, request.action);
            // Try Redis first, fallback to memory
            if (this.isRedisConnected && this.redisClient) {
                return await this.checkRedisRateLimit(key, limits, weight);
            }
            else {
                this.logger.warn('Using memory fallback for rate limiting', {
                    action: request.action,
                    identifier: request.identifier
                });
                return await this.checkMemoryRateLimit(key, limits, weight);
            }
        }
        catch (error) {
            this.logger.error('Rate limit check failed', {
                error: error.message,
                action: request.action,
                identifier: request.identifier
            });
            // In case of error, allow the request but log it
            return {
                allowed: true,
                limit: ACTION_LIMITS.default.requests,
                remaining: ACTION_LIMITS.default.requests,
                resetTime: new Date(Date.now() + ACTION_LIMITS.default.windowMs),
                metadata: {
                    algorithm: 'memory-fallback',
                    hitCount: 0,
                    windowStart: new Date()
                }
            };
        }
    }
    /**
     * Redis-based sliding window rate limiting
     */
    async checkRedisRateLimit(key, limits, weight) {
        const now = Date.now();
        const window = limits.windowMs;
        const windowStart = now - window;
        // Lua script for atomic sliding window check
        const luaScript = `
      local key = KEYS[1]
      local window_start = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local weight = tonumber(ARGV[4])
      local window_ms = tonumber(ARGV[5])
      
      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
      
      -- Get current count
      local current = redis.call('ZCARD', key)
      local remaining = math.max(0, limit - current - weight)
      local allowed = current + weight <= limit
      
      if allowed then
        -- Add current request with score = timestamp
        for i = 1, weight do
          redis.call('ZADD', key, now, now .. ':' .. i)
        end
        redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
      end
      
      return {
        allowed and 1 or 0,
        limit,
        remaining,
        current + (allowed and weight or 0),
        now + window_ms
      }
    `;
        const result = await this.redisClient.eval(luaScript, 1, key, windowStart.toString(), now.toString(), limits.requests.toString(), weight.toString(), window.toString());
        const [allowed, limit, remaining, hitCount, resetTime] = result;
        return {
            allowed: allowed === 1,
            limit,
            remaining,
            resetTime: new Date(resetTime),
            retryAfter: allowed === 0 ? Math.ceil(window / 1000) : undefined,
            metadata: {
                algorithm: 'sliding-window',
                hitCount,
                windowStart: new Date(windowStart)
            }
        };
    }
    /**
     * Memory-based rate limiting fallback
     */
    async checkMemoryRateLimit(key, limits, weight) {
        const now = Date.now();
        const window = limits.windowMs;
        const windowStart = now - window;
        // Get or create window data
        let windowData = this.memoryStore.get(key);
        if (!windowData) {
            windowData = {
                requests: [],
                firstRequest: now
            };
            this.memoryStore.set(key, windowData);
        }
        // Remove expired requests
        windowData.requests = windowData.requests.filter((timestamp) => timestamp > windowStart);
        const currentCount = windowData.requests.length;
        const remaining = Math.max(0, limits.requests - currentCount - weight);
        const allowed = currentCount + weight <= limits.requests;
        if (allowed) {
            // Add current request timestamps
            for (let i = 0; i < weight; i++) {
                windowData.requests.push(now);
            }
        }
        // Cleanup old entries periodically
        this.cleanupMemoryStore();
        return {
            allowed,
            limit: limits.requests,
            remaining,
            resetTime: new Date(now + window),
            retryAfter: allowed ? undefined : Math.ceil(window / 1000),
            metadata: {
                algorithm: 'memory-fallback',
                hitCount: currentCount + (allowed ? weight : 0),
                windowStart: new Date(windowStart)
            }
        };
    }
    /**
     * Increment rate limit counter (for successful requests)
     */
    async incrementCounter(request) {
        // This is already handled in checkRateLimit for atomic operations
        // This method is provided for compatibility
    }
    /**
     * Get current rate limit status without incrementing
     */
    async getRateLimitStatus(identifier, action) {
        const limits = ACTION_LIMITS[action] || ACTION_LIMITS.default;
        const key = this.generateKey(identifier, action);
        const now = Date.now();
        const window = limits.windowMs;
        const windowStart = now - window;
        try {
            if (this.isRedisConnected && this.redisClient) {
                const count = await this.redisClient.zcount(key, windowStart, now);
                const remaining = Math.max(0, limits.requests - count);
                return {
                    allowed: count < limits.requests,
                    limit: limits.requests,
                    remaining,
                    resetTime: new Date(now + window),
                    metadata: {
                        algorithm: 'sliding-window',
                        hitCount: count,
                        windowStart: new Date(windowStart)
                    }
                };
            }
            else {
                const windowData = this.memoryStore.get(key) || { requests: [] };
                const validRequests = windowData.requests.filter((timestamp) => timestamp > windowStart);
                const remaining = Math.max(0, limits.requests - validRequests.length);
                return {
                    allowed: validRequests.length < limits.requests,
                    limit: limits.requests,
                    remaining,
                    resetTime: new Date(now + window),
                    metadata: {
                        algorithm: 'memory-fallback',
                        hitCount: validRequests.length,
                        windowStart: new Date(windowStart)
                    }
                };
            }
        }
        catch (error) {
            this.logger.error('Failed to get rate limit status', { error: error.message });
            throw error;
        }
    }
    /**
     * Reset rate limit for specific identifier and action
     */
    async resetRateLimit(identifier, action) {
        const key = this.generateKey(identifier, action);
        try {
            if (this.isRedisConnected && this.redisClient) {
                await this.redisClient.del(key);
            }
            else {
                this.memoryStore.delete(key);
            }
            this.logger.info('Rate limit reset', { identifier, action });
        }
        catch (error) {
            this.logger.error('Failed to reset rate limit', { error: error.message });
        }
    }
    /**
     * Get rate limiting metrics
     */
    async getMetrics() {
        try {
            let totalKeys = 0;
            let activeWindows = 0;
            if (this.isRedisConnected && this.redisClient) {
                const keys = await this.redisClient.keys(`${this.config.keyPrefix}*`);
                totalKeys = keys.length;
                activeWindows = totalKeys; // Each key is an active window
            }
            return {
                totalKeys,
                activeWindows,
                redisConnected: this.isRedisConnected,
                memoryStoreSize: this.memoryStore.size
            };
        }
        catch (error) {
            this.logger.error('Failed to get metrics', { error: error.message });
            return {
                totalKeys: 0,
                activeWindows: 0,
                redisConnected: false,
                memoryStoreSize: this.memoryStore.size
            };
        }
    }
    /**
     * Generate Redis key for rate limiting
     */
    generateKey(identifier, action) {
        return `${this.config.keyPrefix}${action}:${identifier}`;
    }
    /**
     * Cleanup expired entries from memory store
     */
    cleanupMemoryStore() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        for (const [key, data] of this.memoryStore.entries()) {
            if (data.firstRequest && now - data.firstRequest > maxAge) {
                this.memoryStore.delete(key);
            }
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
        this.memoryStore.clear();
        this.logger.info('Rate limit service shutdown completed');
    }
}
exports.RateLimitService = RateLimitService;
// Export singleton instance
exports.rateLimitService = new RateLimitService({
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
    },
    fallbackToMemory: true,
    defaultLimits: {
        requests: 30,
        windowMs: 60000,
        burstAllowance: 5
    },
    keyPrefix: 'mentira_rl:'
});
