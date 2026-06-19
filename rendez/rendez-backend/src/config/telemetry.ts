/**
 * Rendez structured telemetry logger.
 * RD-HIGH-01 FIX: All logging must flow through this module instead of raw console.*.
 * Uses pino for structured JSON output — machine-parseable, aggregator-compatible.
 */
import pino from 'pino';

const env = process.env.NODE_ENV ?? 'development';

export const log = pino({
  level: env === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact common sensitive fields in case they slip into log data
  redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
});
