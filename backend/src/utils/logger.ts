/**
 * Sistema de logging defensivo com Winston
 * Implementa structured logging para debugging eficaz
 */

import winston from 'winston';
import { TelemetryClient } from 'applicationinsights';
import { v4 as uuidv4 } from 'uuid';

// Configuração de níveis de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Interface para contexto de log
export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  service?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown; // Permite propriedades dinâmicas
}

// Formato customizado para logs estruturados
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// Configuração do logger
class DefensiveLogger {
  private logger: winston.Logger;
  private telemetryClient?: TelemetryClient;
  private defaultContext: LogContext = {};
  
  constructor() {
    this.logger = winston.createLogger({
      levels: logLevels,
      level: process.env.LOG_LEVEL || 'info',
      format: structuredFormat,
      defaultMeta: {
        service: 'quem-mente-menos',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
      transports: this.getTransports(),
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
    });
    
    // Configurar Application Insights se disponível
    if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
      this.telemetryClient = new TelemetryClient(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
    }
  }
  
  private getTransports(): winston.transport[] {
    const transports: winston.transport[] = [];
    
    // Console transport para desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }
    
    // File transports para produção
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 10,
      })
    );
    
    return transports;
  }
  
  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }
  
  private enrichContext(context?: LogContext): LogContext {
    return {
      ...this.defaultContext,
      ...context,
      requestId: context?.requestId || this.defaultContext.requestId || uuidv4(),
      timestamp: new Date().toISOString(),
    };
  }
  
  private sanitize(data: any): any {
    if (!data) return data;
    
    // Remove dados sensíveis
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitize(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
  
  // Métodos de log principais
  info(message: string, context?: LogContext): void {
    const enrichedContext = this.enrichContext(context);
    this.logger.info(message, this.sanitize(enrichedContext));
    
    if (this.telemetryClient) {
      this.telemetryClient.trackEvent({
        name: 'Info',
        properties: { message, ...enrichedContext },
      });
    }
  }
  
  warn(message: string, context?: LogContext): void {
    const enrichedContext = this.enrichContext(context);
    this.logger.warn(message, this.sanitize(enrichedContext));
    
    if (this.telemetryClient) {
      this.telemetryClient.trackEvent({
        name: 'Warning',
        properties: { message, ...enrichedContext },
      });
    }
  }
  
  error(message: string, error: Error | unknown, context?: LogContext): void {
    const enrichedContext = this.enrichContext(context);
    const errorObject = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : { error };
    
    this.logger.error(message, {
      ...this.sanitize(enrichedContext),
      error: errorObject,
    });
    
    if (this.telemetryClient) {
      this.telemetryClient.trackException({
        exception: error instanceof Error ? error : new Error(String(error)),
        properties: { message, ...enrichedContext },
      });
    }
  }
  
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'production') return;
    
    const enrichedContext = this.enrichContext(context);
    this.logger.debug(message, this.sanitize(enrichedContext));
  }
  
  trace(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'production') return;
    
    const enrichedContext = this.enrichContext(context);
    this.logger.log('trace', message, this.sanitize(enrichedContext));
  }
  
  // Método para medir performance
  startTimer(): () => void {
    const start = Date.now();
    return () => Date.now() - start;
  }
  
  // Log de métricas
  metric(name: string, value: number, context?: LogContext): void {
    const enrichedContext = this.enrichContext(context);
    
    this.logger.info(`Metric: ${name}`, {
      ...enrichedContext,
      metric: { name, value },
    });
    
    if (this.telemetryClient) {
      this.telemetryClient.trackMetric({
        name,
        value,
        properties: enrichedContext as any,
      });
    }
  }
}

// Singleton instance
export const logger = new DefensiveLogger();

// Funções adicionais para compatibilidade
export function createLogger(context?: LogContext): DefensiveLogger {
  return logger;
}

export function createRequestLogger(requestId?: string): DefensiveLogger {
  return logger;
}

// Export para testes
export { DefensiveLogger };