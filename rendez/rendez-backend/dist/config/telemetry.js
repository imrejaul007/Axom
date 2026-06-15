"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
/**
 * Rendez structured telemetry logger.
 * RD-HIGH-01 FIX: All logging must flow through this module instead of raw console.*.
 * Uses pino for structured JSON output — machine-parseable, aggregator-compatible.
 */
const pino_1 = __importDefault(require("pino"));
const env = process.env.NODE_ENV ?? 'development';
exports.log = (0, pino_1.default)({
    level: env === 'production' ? 'info' : 'debug',
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    // Redact common sensitive fields in case they slip into log data
    redact: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
});
