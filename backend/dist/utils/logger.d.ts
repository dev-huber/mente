/**
 * Sistema de logging defensivo com Winston
 * Implementa structured logging para debugging eficaz
 */
export interface LogContext {
    requestId?: string;
    userId?: string;
    operation?: string;
    service?: string;
    duration?: number;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}
declare class DefensiveLogger {
    private logger;
    private telemetryClient?;
    private defaultContext;
    constructor();
    private getTransports;
    setDefaultContext(context: LogContext): void;
    private enrichContext;
    private sanitize;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error: Error | unknown, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    trace(message: string, context?: LogContext): void;
    startTimer(): () => void;
    metric(name: string, value: number, context?: LogContext): void;
}
export declare const logger: DefensiveLogger;
export declare function createLogger(context?: LogContext): DefensiveLogger;
export declare function createRequestLogger(requestId?: string): DefensiveLogger;
export { DefensiveLogger };
//# sourceMappingURL=logger.d.ts.map