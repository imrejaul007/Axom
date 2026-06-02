/**
 * Plan background workers — Sprint 11
 *
 * planExpiryWorker    — every 10 min: expire OPEN plans past their expiresAt
 * ghostDetectWorker   — every 15 min: flag FILLED plans where selected user hasn't confirmed in 6h
 * autoCancelWorker    — every 30 min: cancel plans that have hit max reselections with no confirmation
 */
import { Worker } from 'bullmq';
export declare const planExpiryWorker: Worker<any, void, string>;
export declare const ghostDetectWorker: Worker<any, void, string>;
export declare const autoCancelWorker: Worker<any, void, string>;
//# sourceMappingURL=planWorkers.d.ts.map