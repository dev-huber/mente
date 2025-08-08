/**
 * Sistema de erros customizados com defensive programming
 * Implementa fail-fast e logging estruturado
 */

import { v4 as uuidv4 } from 'uuid';

export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_ERROR = 1000,
  MISSING_REQUIRED_FIELD = 1001,
  INVALID_FORMAT = 1002,
  VALUE_OUT_OF_RANGE = 1003,
  
  // Authentication errors (2000-2999)
  AUTHENTICATION_FAILED = 2000,
  TOKEN_EXPIRED = 2001,
  TOKEN_INVALID = 2002,
  INSUFFICIENT_PERMISSIONS = 2003,
  
  // Business logic errors (3000-3999)
  AUDIO_PROCESSING_FAILED = 3000,
  LIE_DETECTION_FAILED = 3001,
  QUOTA_EXCEEDED = 3002,
  
  // External service errors (4000-4999)
  AZURE_SERVICE_ERROR = 4000,
  STORAGE_ERROR = 4001,
  AI_SERVICE_ERROR = 4002,
  
  // System errors (5000-5999)
  INTERNAL_SERVER_ERROR = 5000,
  DATABASE_ERROR = 5001,
  CIRCUIT_BREAKER_OPEN = 5002,
  RATE_LIMIT_EXCEEDED = 5003,
}

export interface ErrorContext {
  errorId: string;
  timestamp: Date;
  service: string;
  operation: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export abstract class BaseError extends Error {
  public readonly errorId: string;
  public readonly code: ErrorCode;
  public readonly timestamp: Date;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational: boolean = true,
    context?: Partial<ErrorContext>
  ) {
    super(message);
    
    this.errorId = uuidv4();
    this.code = code;
    this.timestamp = new Date();
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    this.context = {
      errorId: this.errorId,
      timestamp: this.timestamp,
      service: context?.service || 'unknown',
      operation: context?.operation || 'unknown',
      ...context,
    };
    
    // Mantém stack trace apropriado
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
  
  toJSON() {
    return {
      errorId: this.errorId,
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTHENTICATION_FAILED, context?: Partial<ErrorContext>) {
    super(message, code, 401, true, context);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string, context?: Partial<ErrorContext>) {
    super(message, ErrorCode.INSUFFICIENT_PERMISSIONS, 403, true, context);
  }
}

export class BusinessLogicError extends BaseError {
  constructor(message: string, code: ErrorCode, context?: Partial<ErrorContext>) {
    super(message, code, 422, true, context);
  }
}

export class ExternalServiceError extends BaseError {
  public readonly service: string;
  public readonly originalError?: Error;
  
  constructor(
    message: string,
    service: string,
    originalError?: Error,
    context?: Partial<ErrorContext>
  ) {
    super(message, ErrorCode.AZURE_SERVICE_ERROR, 502, false, context);
    this.service = service;
    this.originalError = originalError;
  }
}

export class SystemError extends BaseError {
  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, context?: Partial<ErrorContext>) {
    super(message, code, 500, false, context);
  }
}

export class RateLimitError extends BaseError {
  public readonly retryAfter: number;
  
  constructor(message: string, retryAfter: number, context?: Partial<ErrorContext>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
    this.retryAfter = retryAfter;
  }
}
