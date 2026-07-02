/**
 * BuzzLocal Services Logger Utility
 * Shared logger for all microservices
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service?: string;
    requestId?: string;
    [key: string]: unknown;
}
declare class Logger {
    private service;
    private minLevel;
    private levels;
    constructor(service?: string);
    private shouldLog;
    private formatEntry;
    private log;
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log startup banner with ASCII art
     */
    startup(port: number, features?: string[]): void;
}
//# sourceMappingURL=logger.d.ts.map