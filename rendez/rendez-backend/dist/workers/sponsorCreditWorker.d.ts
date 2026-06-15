/**
 * Sponsor credit retry worker — processes BullMQ jobs for failed sponsor coin credits.
 *
 * BULLETPROOF: PlanService.confirmAttendance catches creditCoins failures and enqueues
 * a retry job here. This worker handles the retry with:
 *   - 3 attempts, exponential backoff (10s → 20s → 40s)
 *   - Idempotency key ensures no double-credit on retry
 *   - After all retries exhausted, job moves to BullMQ Failed State for DLQ inspection
 *   - DLQ entries are queryable via admin endpoint
 */
import { Worker } from 'bullmq';
export declare const sponsorCreditWorker: Worker<any, any, string>;
//# sourceMappingURL=sponsorCreditWorker.d.ts.map