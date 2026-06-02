/**
 * Rendez structured telemetry logger.
 * RD-HIGH-01 FIX: All logging must flow through this module instead of raw console.*.
 * Uses pino for structured JSON output — machine-parseable, aggregator-compatible.
 */
import pino from 'pino';
export declare const log: pino.Logger<never, boolean>;
//# sourceMappingURL=telemetry.d.ts.map