"use strict";
/**
 * Shared logger utility for Azure Functions with defensive logging patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
/**
 * Structured logger with defensive error handling
 */
class Logger {
    constructor(defaultContext) {
        this.context = {};
        this.context = { ...defaultContext };
    }
    /**
     * Set global context for all log entries
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Log info message with context
     */
    info(message, additionalContext) {
        this.log({
            level: 'info',
            message,
            context: this.mergeContext(additionalContext)
        });
    }
    /**
     * Log warning message with context
     */
    warn(message, additionalContext) {
        this.log({
            level: 'warn',
            message,
            context: this.mergeContext(additionalContext)
        });
    }
    /**
     * Log error message with context and error details
     */
    error(message, additionalContext) {
        // Extract error information if present in context
        let errorInfo;
        if (additionalContext === null || additionalContext === void 0 ? void 0 : additionalContext.error) {
            const error = additionalContext.error;
            if (error instanceof Error) {
                errorInfo = {
                    message: error.message,
                    stack: error.stack || undefined,
                    name: error.name || undefined
                };
            }
            else if (typeof error === 'string') {
                errorInfo = {
                    message: error
                };
            }
            else if (typeof error === 'object') {
                errorInfo = {
                    message: String(error),
                    stack: error.stack,
                    name: error.name
                };
            }
        }
        this.log({
            level: 'error',
            message,
            context: this.mergeContext(additionalContext),
            error: errorInfo || undefined
        });
    }
    /**
     * Log debug message with context (only in development)
     */
    debug(message, additionalContext) {
        // Only log debug in development environment
        if (process.env.NODE_ENV !== 'production') {
            this.log({
                level: 'debug',
                message,
                context: this.mergeContext(additionalContext)
            });
        }
    }
    /**
     * Create a child logger with additional context
     */
    child(childContext) {
        const childLogger = new Logger();
        childLogger.setContext({ ...this.context, ...childContext });
        return childLogger;
    }
    /**
     * Internal log method that outputs structured logs
     */
    log(entry) {
        var _a;
        try {
            // Add timestamp if not present
            const enrichedEntry = {
                ...entry,
                context: {
                    ...entry.context,
                    timestamp: ((_a = entry.context) === null || _a === void 0 ? void 0 : _a.timestamp) || new Date().toISOString()
                }
            };
            // Create console-friendly output with defensive formatting
            const logOutput = this.formatLogEntry(enrichedEntry);
            // Output to appropriate console method
            switch (entry.level) {
                case 'error':
                    console.error(logOutput);
                    break;
                case 'warn':
                    console.warn(logOutput);
                    break;
                case 'debug':
                    console.debug(logOutput);
                    break;
                case 'info':
                default:
                    console.log(logOutput);
                    break;
            }
            // In production, could also send to external logging service
            if (process.env.NODE_ENV === 'production') {
                this.sendToExternalLogger(enrichedEntry);
            }
        }
        catch (error) {
            // Fallback logging - never let logging itself crash the application
            console.error('Logger error:', error);
            console.error('Original message:', entry.message);
        }
    }
    /**
     * Merge additional context with global context
     */
    mergeContext(additionalContext) {
        return {
            ...this.context,
            ...additionalContext
        };
    }
    /**
     * Format log entry for console output
     */
    formatLogEntry(entry) {
        var _a;
        try {
            const parts = [];
            // Timestamp
            if ((_a = entry.context) === null || _a === void 0 ? void 0 : _a.timestamp) {
                parts.push(`[${entry.context.timestamp}]`);
            }
            // Level
            parts.push(`${entry.level.toUpperCase()}:`);
            // Message
            parts.push(entry.message);
            // Context (excluding timestamp and error)
            if (entry.context) {
                const contextCopy = { ...entry.context };
                delete contextCopy.timestamp;
                delete contextCopy.error;
                if (Object.keys(contextCopy).length > 0) {
                    parts.push(`| Context: ${JSON.stringify(contextCopy)}`);
                }
            }
            // Error details
            if (entry.error) {
                parts.push(`| Error: ${entry.error.message}`);
                if (entry.error.stack && process.env.NODE_ENV !== 'production') {
                    parts.push(`| Stack: ${entry.error.stack}`);
                }
            }
            return parts.join(' ');
        }
        catch (error) {
            // Fallback to simple string representation
            return `${entry.level.toUpperCase()}: ${entry.message} [Formatting Error]`;
        }
    }
    /**
     * Send logs to external logging service (placeholder for production)
     */
    sendToExternalLogger(_entry) {
        // Placeholder for external logging integration
        // Could send to Azure Application Insights, LogDNA, Datadog, etc.
        var _a;
        // For now, just ensure it doesn't crash
        try {
            if (typeof process !== 'undefined' && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.APPINSIGHTS_INSTRUMENTATIONKEY)) {
                // Would integrate with Application Insights here
            }
        }
        catch (error) {
            // Silently handle external logging errors
            console.error('External logging failed:', error);
        }
    }
}
exports.Logger = Logger;
// Create and export default logger instance
exports.logger = new Logger({
    functionName: process.env.FUNCTION_NAME || 'unknown',
    requestId: process.env.INVOCATION_ID || 'unknown'
});
// Helper function for creating request-scoped loggers
function createRequestLogger(requestId, additionalContext) {
    return exports.logger.child({
        requestId,
        ...additionalContext
    });
}
//# sourceMappingURL=logger.js.map