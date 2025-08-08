"use strict";
/**
 * Sistema de erros customizados com defensive programming
 * Implementa fail-fast e logging estruturado
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.SystemError = exports.ExternalServiceError = exports.BusinessLogicError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.BaseError = exports.ErrorCode = void 0;
const uuid_1 = require("uuid");
var ErrorCode;
(function (ErrorCode) {
    // Validation errors (1000-1999)
    ErrorCode[ErrorCode["VALIDATION_ERROR"] = 1000] = "VALIDATION_ERROR";
    ErrorCode[ErrorCode["MISSING_REQUIRED_FIELD"] = 1001] = "MISSING_REQUIRED_FIELD";
    ErrorCode[ErrorCode["INVALID_FORMAT"] = 1002] = "INVALID_FORMAT";
    ErrorCode[ErrorCode["VALUE_OUT_OF_RANGE"] = 1003] = "VALUE_OUT_OF_RANGE";
    // Authentication errors (2000-2999)
    ErrorCode[ErrorCode["AUTHENTICATION_FAILED"] = 2000] = "AUTHENTICATION_FAILED";
    ErrorCode[ErrorCode["TOKEN_EXPIRED"] = 2001] = "TOKEN_EXPIRED";
    ErrorCode[ErrorCode["TOKEN_INVALID"] = 2002] = "TOKEN_INVALID";
    ErrorCode[ErrorCode["INSUFFICIENT_PERMISSIONS"] = 2003] = "INSUFFICIENT_PERMISSIONS";
    // Business logic errors (3000-3999)
    ErrorCode[ErrorCode["AUDIO_PROCESSING_FAILED"] = 3000] = "AUDIO_PROCESSING_FAILED";
    ErrorCode[ErrorCode["LIE_DETECTION_FAILED"] = 3001] = "LIE_DETECTION_FAILED";
    ErrorCode[ErrorCode["QUOTA_EXCEEDED"] = 3002] = "QUOTA_EXCEEDED";
    // External service errors (4000-4999)
    ErrorCode[ErrorCode["AZURE_SERVICE_ERROR"] = 4000] = "AZURE_SERVICE_ERROR";
    ErrorCode[ErrorCode["STORAGE_ERROR"] = 4001] = "STORAGE_ERROR";
    ErrorCode[ErrorCode["AI_SERVICE_ERROR"] = 4002] = "AI_SERVICE_ERROR";
    // System errors (5000-5999)
    ErrorCode[ErrorCode["INTERNAL_SERVER_ERROR"] = 5000] = "INTERNAL_SERVER_ERROR";
    ErrorCode[ErrorCode["DATABASE_ERROR"] = 5001] = "DATABASE_ERROR";
    ErrorCode[ErrorCode["CIRCUIT_BREAKER_OPEN"] = 5002] = "CIRCUIT_BREAKER_OPEN";
    ErrorCode[ErrorCode["RATE_LIMIT_EXCEEDED"] = 5003] = "RATE_LIMIT_EXCEEDED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class BaseError extends Error {
    errorId;
    code;
    timestamp;
    context;
    isOperational;
    statusCode;
    constructor(message, code, statusCode, isOperational = true, context) {
        super(message);
        this.errorId = (0, uuid_1.v4)();
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
exports.BaseError = BaseError;
class ValidationError extends BaseError {
    constructor(message, context) {
        super(message, ErrorCode.VALIDATION_ERROR, 400, true, context);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends BaseError {
    constructor(message, code = ErrorCode.AUTHENTICATION_FAILED, context) {
        super(message, code, 401, true, context);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends BaseError {
    constructor(message, context) {
        super(message, ErrorCode.INSUFFICIENT_PERMISSIONS, 403, true, context);
    }
}
exports.AuthorizationError = AuthorizationError;
class BusinessLogicError extends BaseError {
    constructor(message, code, context) {
        super(message, code, 422, true, context);
    }
}
exports.BusinessLogicError = BusinessLogicError;
class ExternalServiceError extends BaseError {
    service;
    originalError;
    constructor(message, service, originalError, context) {
        super(message, ErrorCode.AZURE_SERVICE_ERROR, 502, false, context);
        this.service = service;
        this.originalError = originalError;
    }
}
exports.ExternalServiceError = ExternalServiceError;
class SystemError extends BaseError {
    constructor(message, code = ErrorCode.INTERNAL_SERVER_ERROR, context) {
        super(message, code, 500, false, context);
    }
}
exports.SystemError = SystemError;
class RateLimitError extends BaseError {
    retryAfter;
    constructor(message, retryAfter, context) {
        super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context);
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
