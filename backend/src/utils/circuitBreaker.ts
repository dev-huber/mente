/**
 * Circuit Breaker pattern implementation
 * Protege contra falhas em cascata e permite recuperação graciosa
 */

import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private successCount: number = 0;
  private nextAttempt?: Date;
  
  constructor(private options: CircuitBreakerOptions) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN. Next attempt at ${this.nextAttempt}`);
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) return false;
    return new Date() >= this.nextAttempt;
  }
  
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    
    if (newState === CircuitState.OPEN) {
      this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
      this.successCount = 0;
    }
    
    logger.info(`Circuit breaker state change: ${oldState} -> ${newState}`, {
      operation: 'transitionTo',
      service: 'CircuitBreaker',
      metadata: {
        oldState,
        newState,
        failureCount: this.failureCount,
        nextAttempt: this.nextAttempt,
      },
    });
    
    this.options.onStateChange?.(oldState, newState);
  }
  
  isOpen(): boolean {
    return this.state === CircuitState.OPEN && !this.shouldAttemptReset();
  }
  
  getState(): CircuitState {
    return this.state;
  }
}
