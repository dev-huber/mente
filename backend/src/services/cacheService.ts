/**
 * Serviço de Cache Defensivo para "Quem Mente Menos?"
 * Implementa caching inteligente com fallbacks
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';
import { ExternalServiceError } from '@/core/errors/CustomErrors';

export interface CacheOptions {
  ttl?: number; // Time to live em segundos
  tags?: string[]; // Tags para invalidação em grupo
}

export class CacheService {
  private client: RedisClientType | null = null;
  private localCache: Map<string, { value: any; expiry: number }> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly defaultTTL: number = 300; // 5 minutos
  
  constructor() {
    this.initializeRedis();
  }
  
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_CONNECTION_STRING;
      
      if (!redisUrl) {
        logger.warn('Redis não configurado, usando cache local apenas', {
          operation: 'initializeRedis',
          service: 'CacheService',
        });
        return;
      }
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Max reconnect attempts reached', new Error('Redis connection failed'), {
                operation: 'reconnectStrategy',
                service: 'CacheService',
                metadata: { attempts: retries },
              });
              return false;
            }
            // Exponential backoff
            return Math.min(retries * 100, 3000);
          },
        },
      });
      
      // Event handlers defensivos
      this.client.on('connect', () => {
        logger.info('Redis connected', {
          operation: 'redis-connect',
          service: 'CacheService',
        });
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });
      
      this.client.on('error', (error) => {
        logger.error('Redis error', error, {
          operation: 'redis-error',
          service: 'CacheService',
        });
        this.isConnected = false;
      });
      
      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.info('Redis reconnecting', {
          operation: 'redis-reconnecting',
          service: 'CacheService',
          metadata: { attempt: this.reconnectAttempts },
        });
      });
      
      await this.client.connect();
      
    } catch (error) {
      logger.error('Failed to initialize Redis', error, {
        operation: 'initializeRedis',
        service: 'CacheService',
      });
      // Continuar sem Redis - usar apenas cache local
      this.isConnected = false;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    const timer = logger.startTimer();
    
    try {
      // Tentar Redis primeiro se conectado
      if (this.isConnected && this.client) {
        try {
          const value = await this.client.get(key);
          if (value) {
            const duration = timer();
            logger.debug('Cache hit (Redis)', {
              operation: 'get',
              service: 'CacheService',
              duration,
              metadata: { key },
            });
            
            return JSON.parse(value);
          }
        } catch (redisError) {
          logger.warn('Redis get failed, falling back to local cache', {
            operation: 'get',
            service: 'CacheService',
            metadata: { key, error: (redisError as Error).message },
          });
        }
      }
      
      // Fallback para cache local
      const localEntry = this.localCache.get(key);
      if (localEntry && localEntry.expiry > Date.now()) {
        const duration = timer();
        logger.debug('Cache hit (local)', {
          operation: 'get',
          service: 'CacheService',
          duration,
          metadata: { key },
        });
        
        return localEntry.value;
      }
      
      // Cache miss
      const duration = timer();
      logger.debug('Cache miss', {
        operation: 'get',
        service: 'CacheService',
        duration,
        metadata: { key },
      });
      
      return null;
      
    } catch (error) {
      logger.error('Cache get error', error, {
        operation: 'get',
        service: 'CacheService',
        metadata: { key },
      });
      
      return null; // Fail silently - cache should not break the app
    }
  }
  
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const timer = logger.startTimer();
    const ttl = options.ttl || this.defaultTTL;
    
    try {
      const serialized = JSON.stringify(value);
      
      // Salvar em cache local sempre
      this.localCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000),
      });
      
      // Limpar cache local antigo periodicamente
      this.cleanupLocalCache();
      
      // Tentar salvar no Redis se conectado
      if (this.isConnected && this.client) {
        try {
          await this.client.setEx(key, ttl, serialized);
          
          // Adicionar tags se fornecidas
          if (options.tags && options.tags.length > 0) {
            await this.addToTags(key, options.tags);
          }
          
          const duration = timer();
          logger.debug('Cache set (Redis + local)', {
            operation: 'set',
            service: 'CacheService',
            duration,
            metadata: { key, ttl, tags: options.tags },
          });
        } catch (redisError) {
          logger.warn('Redis set failed, saved to local cache only', {
            operation: 'set',
            service: 'CacheService',
            metadata: { key, error: (redisError as Error).message },
          });
        }
      } else {
        const duration = timer();
        logger.debug('Cache set (local only)', {
          operation: 'set',
          service: 'CacheService',
          duration,
          metadata: { key, ttl },
        });
      }
      
    } catch (error) {
      logger.error('Cache set error', error, {
        operation: 'set',
        service: 'CacheService',
        metadata: { key },
      });
      // Não lançar erro - cache não deve quebrar a aplicação
    }
  }
  
  async invalidate(key: string): Promise<void> {
    try {
      // Remover do cache local
      this.localCache.delete(key);
      
      // Remover do Redis se conectado
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
      
      logger.debug('Cache invalidated', {
        operation: 'invalidate',
        service: 'CacheService',
        metadata: { key },
      });
      
    } catch (error) {
      logger.error('Cache invalidate error', error, {
        operation: 'invalidate',
        service: 'CacheService',
        metadata: { key },
      });
    }
  }
  
  async invalidateByTag(tag: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.sMembers(`tag:${tag}`);
        
        if (keys.length > 0) {
          // Invalidar todas as chaves com a tag
          await Promise.all(keys.map(key => this.invalidate(key)));
          
          // Limpar o set de tags
          await this.client.del(`tag:${tag}`);
        }
        
        logger.debug('Cache invalidated by tag', {
          operation: 'invalidateByTag',
          service: 'CacheService',
          metadata: { tag, keysInvalidated: keys.length },
        });
      }
    } catch (error) {
      logger.error('Cache invalidate by tag error', error, {
        operation: 'invalidateByTag',
        service: 'CacheService',
        metadata: { tag },
      });
    }
  }
  
  async flush(): Promise<void> {
    try {
      // Limpar cache local
      this.localCache.clear();
      
      // Limpar Redis se conectado
      if (this.isConnected && this.client) {
        await this.client.flushDb();
      }
      
      logger.info('Cache flushed', {
        operation: 'flush',
        service: 'CacheService',
      });
      
    } catch (error) {
      logger.error('Cache flush error', error, {
        operation: 'flush',
        service: 'CacheService',
      });
    }
  }
  
  private async addToTags(key: string, tags: string[]): Promise<void> {
    if (!this.isConnected || !this.client) return;
    
    try {
      await Promise.all(
        tags.map(tag => this.client!.sAdd(`tag:${tag}`, key))
      );
    } catch (error) {
      logger.warn('Failed to add cache tags', {
        operation: 'addToTags',
        service: 'CacheService',
        metadata: { key, tags },
      });
    }
  }
  
  private cleanupLocalCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Identificar chaves expiradas
    this.localCache.forEach((entry, key) => {
      if (entry.expiry <= now) {
        keysToDelete.push(key);
      }
    });
    
    // Remover chaves expiradas
    keysToDelete.forEach(key => this.localCache.delete(key));
    
    // Limitar tamanho do cache local
    const maxLocalCacheSize = 1000;
    if (this.localCache.size > maxLocalCacheSize) {
      const entriesToRemove = this.localCache.size - maxLocalCacheSize;
      const keys = Array.from(this.localCache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.localCache.delete(key));
      
      logger.warn('Local cache size limit reached, removed oldest entries', {
        operation: 'cleanupLocalCache',
        service: 'CacheService',
        metadata: { removed: entriesToRemove, currentSize: this.localCache.size },
      });
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Redis disconnected', {
          operation: 'disconnect',
          service: 'CacheService',
        });
      }
    } catch (error) {
      logger.error('Error disconnecting Redis', error, {
        operation: 'disconnect',
        service: 'CacheService',
      });
    }
  }
}

// Singleton export
export const cacheService = new CacheService();
