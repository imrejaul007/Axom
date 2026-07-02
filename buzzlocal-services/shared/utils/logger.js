"use strict";
/**
 * BuzzLocal Services Logger Utility
 * Shared logger for all microservices
 */
class Logger {
    service;
    minLevel;
    levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };
    constructor(service = 'buzzlocal-service') {
        this.service = service;
        this.minLevel = process.env.LOG_LEVEL || 'info';
    }
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.minLevel];
    }
    formatEntry(level, message, meta) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: this.service,
            ...meta,
        };
    }
    log(level, message, meta) {
        if (!this.shouldLog(level))
            return;
        const entry = this.formatEntry(level, message, meta);
        const output = JSON.stringify(entry);
        if (level === 'error') {
            console.error(output);
        }
        else if (level === 'warn') {
            console.warn(output);
        }
        else {
            console.log(output);
        }
    }
    debug(message, meta) {
        this.log('debug', message, meta);
    }
    info(message, meta) {
        this.log('info', message, meta);
    }
    warn(message, meta) {
        this.log('warn', message, meta);
    }
    error(message, meta) {
        this.log('error', message, meta);
    }
    /**
     * Log startup banner with ASCII art
     */
    startup(port, features) {
        const featureList = features ? features.map(f => `  • ${f}`).join('\n') : '';
        this.info(`Service started on port ${port}`);
        logger.info($, { this: .service.padEnd(52) }, Port, $, { String(port) { }, : .padEnd(54) }, $, { featureList } `╠═══════════════════════════════════════════════════════════════╣\n${featureList}`, '');
    }
}
`);
  }

  child(childService: string): Logger {
    return new Logger(`;
$;
{
    this.service;
}
$;
{
    childService;
}
`);
  }
}

export const logger = new Logger();
export default logger;
;
//# sourceMappingURL=logger.js.map