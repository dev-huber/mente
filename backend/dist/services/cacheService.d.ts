/**
 * Serviço de Cache Defensivo para "Quem Mente Menos?"
 * Implementa caching inteligente com fallbacks
 */
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
}
export declare class CacheService {
    private client;
    private localCache;
    private isConnected;
    private reconnectAttempts;
    private readonly maxReconnectAttempts;
    private readonly defaultTTL;
    constructor();
    private initializeRedis;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    invalidate(key: string): Promise<void>;
    invalidateByTag(tag: string): Promise<void>;
    flush(): Promise<void>;
    private addToTags;
    private cleanupLocalCache;
    disconnect(): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cacheService.d.ts.map