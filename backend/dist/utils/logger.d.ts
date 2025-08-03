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
declare class Logger {
    private context;
    constructor(defaultContext?: LogContext);
    /**
     * Set global context for all log entries
     */
    setContext(context: LogContext): void;
    /**
     * Log info message with context
     */
    info(message: string, additionalContext?: LogContext): void;
    /**
     * Log warning message with context
     */
    warn(message: string, additionalContext?: LogContext): void;
    /**
     * Log error message with context and error details
     */
    error(message: string, additionalContext?: LogContext): void;
    /**
     * Log debug message with context (only in development)
     */
    debug(message: string, additionalContext?: LogContext): void;
    /**
     * Create a child logger with additional context
     */
    child(childContext: LogContext): Logger;
    /**
     * Internal log method that outputs structured logs
     */
    private log;
    /**
     * Merge additional context with global context
     */
    private mergeContext;
    /**
     * Format log entry for console output
     */
    private formatLogEntry;
    /**
     * Send logs to external logging service (placeholder for production)
     */
    private sendToExternalLogger;
}
export declare const logger: Logger;
export { Logger };
export declare function createRequestLogger(requestId: string, additionalContext?: LogContext): Logger;
//# sourceMappingURL=logger.d.ts.map