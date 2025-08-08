/**
 * Sistema de erros customizados com defensive programming
 * Implementa fail-fast e logging estruturado
 */
export declare enum ErrorCode {
    VALIDATION_ERROR = 1000,
    MISSING_REQUIRED_FIELD = 1001,
    INVALID_FORMAT = 1002,
    VALUE_OUT_OF_RANGE = 1003,
    AUTHENTICATION_FAILED = 2000,
    TOKEN_EXPIRED = 2001,
    TOKEN_INVALID = 2002,
    INSUFFICIENT_PERMISSIONS = 2003,
    AUDIO_PROCESSING_FAILED = 3000,
    LIE_DETECTION_FAILED = 3001,
    QUOTA_EXCEEDED = 3002,
    AZURE_SERVICE_ERROR = 4000,
    STORAGE_ERROR = 4001,
    AI_SERVICE_ERROR = 4002,
    INTERNAL_SERVER_ERROR = 5000,
    DATABASE_ERROR = 5001,
    CIRCUIT_BREAKER_OPEN = 5002,
    RATE_LIMIT_EXCEEDED = 5003
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
export declare abstract class BaseError extends Error {
    readonly errorId: string;
    readonly code: ErrorCode;
    readonly timestamp: Date;
    readonly context: ErrorContext;
    readonly isOperational: boolean;
    readonly statusCode: number;
    constructor(message: string, code: ErrorCode, statusCode: number, isOperational?: boolean, context?: Partial<ErrorContext>);
    toJSON(): {
        errorId: string;
        name: string;
        message: string;
        code: ErrorCode;
        statusCode: number;
        timestamp: Date;
        context: ErrorContext;
        stack: string | undefined;
    };
}
export declare class ValidationError extends BaseError {
    constructor(message: string, context?: Partial<ErrorContext>);
}
export declare class AuthenticationError extends BaseError {
    constructor(message: string, code?: ErrorCode, context?: Partial<ErrorContext>);
}
export declare class AuthorizationError extends BaseError {
    constructor(message: string, context?: Partial<ErrorContext>);
}
export declare class BusinessLogicError extends BaseError {
    constructor(message: string, code: ErrorCode, context?: Partial<ErrorContext>);
}
export declare class ExternalServiceError extends BaseError {
    readonly service: string;
    readonly originalError?: Error;
    constructor(message: string, service: string, originalError?: Error, context?: Partial<ErrorContext>);
}
export declare class SystemError extends BaseError {
    constructor(message: string, code?: ErrorCode, context?: Partial<ErrorContext>);
}
export declare class RateLimitError extends BaseError {
    readonly retryAfter: number;
    constructor(message: string, retryAfter: number, context?: Partial<ErrorContext>);
}
//# sourceMappingURL=CustomErrors.d.ts.map