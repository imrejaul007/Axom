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

class Logger {
  private service: string;
  private minLevel: LogLevel;

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(service = 'buzzlocal-service') {
    this.service = service;
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...meta,
    };
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, meta);
    const output = JSON.stringify(entry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  /**
   * Log startup banner with ASCII art
   */
  startup(port: number, features?: string[]): void {
    const featureList = features ? features.map(f => `  - ${f}`).join('\n') : '';
    this.info(`Service started on port ${port}`);
    if (featureList) {
      console.log(`[${this.service}] Features:\n${featureList}`);
    }
  }

  child(childService: string): Logger {
    return new Logger(`${this.service}:${childService}`);
  }
}

export const logger = new Logger();
export default logger;
