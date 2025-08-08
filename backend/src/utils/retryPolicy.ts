/**
 * Retry Policy com exponential backoff
 * Implementa retry inteligente para operações falíveis
 */

import { logger } from './logger';

export interface RetryPolicyOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
  shouldRetry?: (error: any) => boolean;
}

export class RetryPolicy {
  constructor(private options: RetryPolicyOptions) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    let delay = this.options.initialDelay;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.options.maxRetries) {
          break;
        }
        
        if (this.options.shouldRetry && !this.options.shouldRetry(error)) {
          throw error;
        }
        
        logger.warn(`Retry attempt ${attempt + 1}/${this.options.maxRetries}`, {
          operation: 'execute',
          service: 'RetryPolicy',
          metadata: {
            attempt: attempt + 1,
            delay,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        
        await this.sleep(delay);
        delay = Math.min(delay * this.options.factor, this.options.maxDelay);
      }
    }
    
    logger.error('All retry attempts failed', lastError, {
      operation: 'execute',
      service: 'RetryPolicy',
      metadata: { maxRetries: this.options.maxRetries },
    });
    
    throw lastError;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
