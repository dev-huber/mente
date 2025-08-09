/**
 * Circuit Breaker Pattern Implementation
 * - Prevents cascade failures in distributed systems
 * - Automatic failure detection and recovery
 * - Multiple failure thresholds and recovery strategies
 * - Real-time monitoring and metrics
 * - Service-specific configuration
 */

import { DefensiveLogger } from '../utils/logger';
import { createLogger } from '../utils/logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time to wait before attempting recovery (ms)
  requestTimeout: number; // Timeout for individual requests (ms)
  successThreshold: number; // Successes needed in HALF_OPEN to close
  monitoringWindow: number; // Time window for failure tracking (ms)
  fallbackEnabled: boolean; // Whether to use fallback when circuit is open
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

// Service-specific configurations
const SERVICE_CONFIGS: Record<string, CircuitBreakerConfig> = {
  'azure-speech': {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    requestTimeout: 30000, // 30 seconds
    successThreshold: 2,
    monitoringWindow: 300000, // 5 minutes
    fallbackEnabled: true
  },
  'azure-text-analytics': {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    requestTimeout: 15000, // 15 seconds
    successThreshold: 2,
    monitoringWindow: 180000, // 3 minutes
    fallbackEnabled: true
  },
  'azure-openai': {
    failureThreshold: 3,
    recoveryTimeout: 45000, // 45 seconds
    requestTimeout: 60000, // 60 seconds for AI processing
    successThreshold: 1,
    monitoringWindow: 240000, // 4 minutes
    fallbackEnabled: true
  },
  'storage': {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    requestTimeout: 20000,
    successThreshold: 3,
    monitoringWindow: 300000,
    fallbackEnabled: false
  },
  'default': {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    requestTimeout: 10000,
    successThreshold: 2,
    monitoringWindow: 180000,
    fallbackEnabled: true
  }
};

export class CircuitBreaker {
  private serviceName: string;
  private config: CircuitBreakerConfig;
  private metrics: CircuitMetrics;
  private logger: DefensiveLogger;
  private responseTimesWindow: number[] = [];

  constructor(serviceName: string, customConfig?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = {
      ...SERVICE_CONFIGS[serviceName] || SERVICE_CONFIGS.default,
      ...customConfig
    };

    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      state: 'CLOSED',
      stateChangedAt: Date.now(),
      averageResponseTime: 0
    };

    this.logger = createLogger(`CircuitBreaker:${serviceName}`);
    
    this.logger.info('Circuit breaker initialized', {
      serviceName,
      config: this.config
    });
  }

  /**
   * Execute a service call with circuit breaker protection
   */
  async execute<T>(serviceCall: ServiceCall<T>): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    
    try {
      // Check if circuit allows the request
      if (!this.shouldAllowRequest()) {
        return await this.handleOpenCircuit(serviceCall, startTime);
      }

      // Execute the service call with timeout
      const result = await this.executeWithTimeout(
        serviceCall.serviceFunction,
        serviceCall.timeout || this.config.requestTimeout
      );

      // Record success
      this.recordSuccess(startTime);
      
      return {
        success: true,
        data: result,
        fromFallback: false,
        circuitState: this.metrics.state,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      // Record failure
      this.recordFailure(error, startTime);
      
      // Try fallback if circuit is open and fallback is available
      if (this.metrics.state === 'OPEN' && serviceCall.fallbackFunction) {
        return await this.executeFallback(serviceCall.fallbackFunction, startTime);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        fromFallback: false,
        circuitState: this.metrics.state,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check if the circuit should allow the request
   */
  private shouldAllowRequest(): boolean {
    const now = Date.now();

    switch (this.metrics.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Check if recovery timeout has passed
        if (now - this.metrics.stateChangedAt >= this.config.recoveryTimeout) {
          this.transitionToHalfOpen();
          return true;
        }
        return false;

      case 'HALF_OPEN':
        // Allow limited requests to test service recovery
        return true;

      default:
        return false;
    }
  }

  /**
   * Execute service call with timeout protection
   */
  private async executeWithTimeout<T>(
    serviceFunction: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Service call timeout after ${timeout}ms`));
      }, timeout);

      serviceFunction()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handle requests when circuit is open
   */
  private async handleOpenCircuit<T>(
    serviceCall: ServiceCall<T>,
    startTime: number
  ): Promise<CircuitBreakerResult<T>> {
    if (this.config.fallbackEnabled && serviceCall.fallbackFunction) {
      this.logger.info('Circuit is OPEN, executing fallback', {
        serviceName: this.serviceName
      });
      
      return await this.executeFallback(serviceCall.fallbackFunction, startTime);
    }

    this.logger.warn('Circuit is OPEN and no fallback available', {
      serviceName: this.serviceName
    });

    return {
      success: false,
      error: 'Service unavailable - circuit breaker is OPEN',
      fromFallback: false,
      circuitState: this.metrics.state,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Execute fallback function
   */
  private async executeFallback<T>(
    fallbackFunction: () => Promise<T>,
    startTime: number
  ): Promise<CircuitBreakerResult<T>> {
    try {
      const result = await this.executeWithTimeout(fallbackFunction, this.config.requestTimeout);
      
      this.logger.info('Fallback executed successfully', {
        serviceName: this.serviceName
      });

      return {
        success: true,
        data: result,
        fromFallback: true,
        circuitState: this.metrics.state,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Fallback execution failed', {
        serviceName: this.serviceName,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: `Fallback failed: ${error instanceof Error ? error.message : String(error)}`,
        fromFallback: true,
        circuitState: this.metrics.state,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Record successful service call
   */
  private recordSuccess(startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    this.metrics.successCount++;
    this.metrics.consecutiveFailures = 0;
    this.metrics.lastSuccessTime = Date.now();
    
    this.updateAverageResponseTime(responseTime);

    // Transition from HALF_OPEN to CLOSED if enough successes
    if (this.metrics.state === 'HALF_OPEN') {
      const recentSuccesses = this.getRecentSuccesses();
      if (recentSuccesses >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }

    this.logger.debug('Success recorded', {
      serviceName: this.serviceName,
      responseTime,
      consecutiveFailures: this.metrics.consecutiveFailures,
      state: this.metrics.state
    });
  }

  /**
   * Record failed service call
   */
  private recordFailure(error: any, startTime: number): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.totalRequests++;
    this.metrics.failureCount++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastFailureTime = Date.now();
    
    this.updateAverageResponseTime(responseTime);

    this.logger.warn('Failure recorded', {
      serviceName: this.serviceName,
      error: error instanceof Error ? error.message : String(error),
      consecutiveFailures: this.metrics.consecutiveFailures,
      state: this.metrics.state
    });

    // Check if we need to open the circuit
    if (this.shouldOpenCircuit()) {
      this.transitionToOpen();
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    if (this.metrics.state === 'OPEN') {
      return false; // Already open
    }

    // Open if consecutive failures exceed threshold
    if (this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Open if failure rate in monitoring window exceeds threshold
    const recentFailureRate = this.getRecentFailureRate();
    return recentFailureRate > 0.5; // 50% failure rate
  }

  /**
   * Get recent failure rate within monitoring window
   */
  private getRecentFailureRate(): number {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    
    // This is a simplified implementation
    // In production, you'd want to track requests with timestamps
    if (this.metrics.totalRequests === 0) return 0;
    
    return this.metrics.failureCount / this.metrics.totalRequests;
  }

  /**
   * Get recent successes for HALF_OPEN state evaluation
   */
  private getRecentSuccesses(): number {
    // Simplified: track consecutive successes in HALF_OPEN
    // In production, implement sliding window success tracking
    return this.metrics.state === 'HALF_OPEN' ? 
      this.metrics.successCount - this.metrics.failureCount : 0;
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    this.responseTimesWindow.push(responseTime);
    
    // Keep only last 100 response times
    if (this.responseTimesWindow.length > 100) {
      this.responseTimesWindow.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimesWindow.reduce((sum, time) => sum + time, 0) / 
      this.responseTimesWindow.length;
  }

  /**
   * Transition circuit to OPEN state
   */
  private transitionToOpen(): void {
    this.metrics.state = 'OPEN';
    this.metrics.stateChangedAt = Date.now();
    
    this.logger.error('Circuit breaker OPENED', {
      serviceName: this.serviceName,
      consecutiveFailures: this.metrics.consecutiveFailures,
      totalFailures: this.metrics.failureCount
    });
  }

  /**
   * Transition circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.metrics.state = 'HALF_OPEN';
    this.metrics.stateChangedAt = Date.now();
    
    this.logger.info('Circuit breaker transitioned to HALF_OPEN', {
      serviceName: this.serviceName
    });
  }

  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(): void {
    this.metrics.state = 'CLOSED';
    this.metrics.stateChangedAt = Date.now();
    this.metrics.consecutiveFailures = 0;
    
    this.logger.info('Circuit breaker CLOSED - service recovered', {
      serviceName: this.serviceName
    });
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      state: 'CLOSED',
      stateChangedAt: Date.now(),
      averageResponseTime: 0
    };
    
    this.responseTimesWindow = [];
    
    this.logger.info('Circuit breaker reset', {
      serviceName: this.serviceName
    });
  }
}

// Circuit breaker registry for managing multiple service circuits
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuits = new Map<string, CircuitBreaker>();
  private logger: DefensiveLogger;

  private constructor() {
    this.logger = createLogger('CircuitBreakerRegistry');
  }

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Get or create circuit breaker for service
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuits.has(serviceName)) {
      this.circuits.set(serviceName, new CircuitBreaker(serviceName, config));
      this.logger.info('Circuit breaker created', { serviceName });
    }
    return this.circuits.get(serviceName)!;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitMetrics> {
    const metrics: Record<string, CircuitMetrics> = {};
    for (const [serviceName, circuit] of this.circuits.entries()) {
      metrics[serviceName] = circuit.getMetrics();
    }
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
    this.logger.info('All circuit breakers reset');
  }
}

// Export singleton registry
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();