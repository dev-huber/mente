"use strict";
/**
 * Sistema de logging defensivo com Winston
 * Implementa structured logging para debugging eficaz
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefensiveLogger = exports.logger = void 0;
exports.createLogger = createLogger;
exports.createRequestLogger = createRequestLogger;
const winston_1 = __importDefault(require("winston"));
const applicationinsights_1 = require("applicationinsights");
const uuid_1 = require("uuid");
// Configuração de níveis de log
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5,
};
// Formato customizado para logs estruturados
const structuredFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta,
    });
}));
// Configuração do logger
class DefensiveLogger {
    logger;
    telemetryClient;
    defaultContext = {};
    constructor() {
        this.logger = winston_1.default.createLogger({
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
                new winston_1.default.transports.File({ filename: 'logs/exceptions.log' }),
            ],
            rejectionHandlers: [
                new winston_1.default.transports.File({ filename: 'logs/rejections.log' }),
            ],
        });
        // Configurar Application Insights se disponível
        if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
            this.telemetryClient = new applicationinsights_1.TelemetryClient(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
        }
    }
    getTransports() {
        const transports = [];
        // Console transport para desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            transports.push(new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
            }));
        }
        // File transports para produção
        transports.push(new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
        }), new winston_1.default.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10485760, // 10MB
            maxFiles: 10,
        }));
        return transports;
    }
    setDefaultContext(context) {
        this.defaultContext = { ...this.defaultContext, ...context };
    }
    enrichContext(context) {
        return {
            ...this.defaultContext,
            ...context,
            requestId: context?.requestId || this.defaultContext.requestId || (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
        };
    }
    sanitize(data) {
        if (!data)
            return data;
        // Remove dados sensíveis
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
        if (typeof data === 'object' && data !== null) {
            const sanitized = { ...data };
            for (const key in sanitized) {
                if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                    sanitized[key] = '[REDACTED]';
                }
                else if (typeof sanitized[key] === 'object') {
                    sanitized[key] = this.sanitize(sanitized[key]);
                }
            }
            return sanitized;
        }
        return data;
    }
    // Métodos de log principais
    info(message, context) {
        const enrichedContext = this.enrichContext(context);
        this.logger.info(message, this.sanitize(enrichedContext));
        if (this.telemetryClient) {
            this.telemetryClient.trackEvent({
                name: 'Info',
                properties: { message, ...enrichedContext },
            });
        }
    }
    warn(message, context) {
        const enrichedContext = this.enrichContext(context);
        this.logger.warn(message, this.sanitize(enrichedContext));
        if (this.telemetryClient) {
            this.telemetryClient.trackEvent({
                name: 'Warning',
                properties: { message, ...enrichedContext },
            });
        }
    }
    error(message, error, context) {
        const enrichedContext = this.enrichContext(context);
        const errorObject = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
        } : { error };
        const sanitizedContext = this.sanitize(enrichedContext);
        this.logger.error(message, {
            ...sanitizedContext,
            error: errorObject,
        });
        if (this.telemetryClient) {
            this.telemetryClient.trackException({
                exception: error instanceof Error ? error : new Error(String(error)),
                properties: { message, ...enrichedContext },
            });
        }
    }
    debug(message, context) {
        if (process.env.NODE_ENV === 'production')
            return;
        const enrichedContext = this.enrichContext(context);
        this.logger.debug(message, this.sanitize(enrichedContext));
    }
    trace(message, context) {
        if (process.env.NODE_ENV === 'production')
            return;
        const enrichedContext = this.enrichContext(context);
        this.logger.log('trace', message, this.sanitize(enrichedContext));
    }
    // Método para medir performance
    startTimer() {
        const start = Date.now();
        return () => Date.now() - start;
    }
    // Log de métricas
    metric(name, value, context) {
        const enrichedContext = this.enrichContext(context);
        this.logger.info(`Metric: ${name}`, {
            ...enrichedContext,
            metric: { name, value },
        });
        if (this.telemetryClient) {
            this.telemetryClient.trackMetric({
                name,
                value,
                properties: enrichedContext,
            });
        }
    }
}
exports.DefensiveLogger = DefensiveLogger;
// Singleton instance
exports.logger = new DefensiveLogger();
// Funções adicionais para compatibilidade
function createLogger(context) {
    if (typeof context === 'string') {
        // Se for string, trata como nome do serviço
        exports.logger.setDefaultContext({ service: context });
    }
    else if (context) {
        exports.logger.setDefaultContext(context);
    }
    return exports.logger;
}
function createRequestLogger(requestId) {
    if (typeof requestId === 'string') {
        exports.logger.setDefaultContext({ requestId });
    }
    else if (requestId) {
        exports.logger.setDefaultContext(requestId);
    }
    return exports.logger;
}
