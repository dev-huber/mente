/**
 * Shared logger utility for Azure Functions with defensive logging patterns
 */

export interface LogContext {
    requestId?: string;
    userId?: string;
    functionName?: string;
    timestamp?: string;
    [key: string]: any;
}

export interface LogEntry {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: LogContext;
    error?: {
        message: string;
        stack?: string | undefined;
        name?: string | undefined;
    } | undefined;
}

/**
 * Structured logger with defensive error handling
 */
class Logger {
    private context: LogContext = {};

    constructor(defaultContext?: LogContext) {
        this.context = { ...defaultContext };
    }

    /**
     * Set global context for all log entries
     */
    setContext(context: LogContext): void {
        this.context = { ...this.context, ...context };
    }

    /**
     * Log info message with context
     */
    info(message: string, additionalContext?: LogContext): void {
        this.log({
            level: 'info',
            message,
            context: this.mergeContext(additionalContext)
        });
    }

    /**
     * Log warning message with context
     */
    warn(message: string, additionalContext?: LogContext): void {
        this.log({
            level: 'warn',
            message,
            context: this.mergeContext(additionalContext)
        });
    }

    /**
     * Log error message with context and error details
     */
    error(message: string, additionalContext?: LogContext): void {
        // Extract error information if present in context
        let errorInfo: LogEntry['error'];
        
        if (additionalContext?.error) {
            const error = additionalContext.error;
            if (error instanceof Error) {
                errorInfo = {
                    message: error.message,
                    stack: error.stack || undefined,
                    name: error.name || undefined
                };
            } else if (typeof error === 'string') {
                errorInfo = {
                    message: error
                };
            } else if (typeof error === 'object') {
                errorInfo = {
                    message: String(error),
                    stack: (error as any).stack,
                    name: (error as any).name
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
    debug(message: string, additionalContext?: LogContext): void {
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
    child(childContext: LogContext): Logger {
        const childLogger = new Logger();
        childLogger.setContext({ ...this.context, ...childContext });
        return childLogger;
    }

    /**
     * Internal log method that outputs structured logs
     */
    private log(entry: LogEntry): void {
        try {
            // Add timestamp if not present
            const enrichedEntry: LogEntry = {
                ...entry,
                context: {
                    ...entry.context,
                    timestamp: entry.context?.timestamp || new Date().toISOString()
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

        } catch (error) {
            // Fallback logging - never let logging itself crash the application
            console.error('Logger error:', error);
            console.error('Original message:', entry.message);
        }
    }

    /**
     * Merge additional context with global context
     */
    private mergeContext(additionalContext?: LogContext): LogContext {
        return {
            ...this.context,
            ...additionalContext
        };
    }

    /**
     * Format log entry for console output
     */
    private formatLogEntry(entry: LogEntry): string {
        try {
            const parts: string[] = [];

            // Timestamp
            if (entry.context?.timestamp) {
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

        } catch (error) {
            // Fallback to simple string representation
            return `${entry.level.toUpperCase()}: ${entry.message} [Formatting Error]`;
        }
    }

    /**
     * Send logs to external logging service (placeholder for production)
     */
    private sendToExternalLogger(_entry: LogEntry): void {
        // Placeholder for external logging integration
        // Could send to Azure Application Insights, LogDNA, Datadog, etc.
        
        // For now, just ensure it doesn't crash
        try {
            if (typeof process !== 'undefined' && process.env?.APPINSIGHTS_INSTRUMENTATIONKEY) {
                // Would integrate with Application Insights here
            }
        } catch (error) {
            // Silently handle external logging errors
            console.error('External logging failed:', error);
        }
    }
}

// Create and export default logger instance
export const logger = new Logger({
    functionName: process.env.FUNCTION_NAME || 'unknown',
    requestId: process.env.INVOCATION_ID || 'unknown'
});

// Export Logger class for creating child loggers
export { Logger };

// Helper function for creating request-scoped loggers
export function createRequestLogger(requestId: string, additionalContext?: LogContext): Logger {
    return logger.child({
        requestId,
        ...additionalContext
    });
}
