/**
 * Reward trigger worker — processes BullMQ jobs for meetup reward validation.
 *
 * RZ-B-H3 FIX: Replaces the fire-and-forget .catch() pattern in MeetupService.checkin
 * with a BullMQ queue that provides:
 *   - Automatic retries (3 attempts, exponential backoff)
 *   - Dead Letter Queue for failed jobs
 *   - Visibility timeout independent of Redis NX lock
 */
import { Worker } from 'bullmq';
export declare const rewardTriggerWorker: Worker<any, any, string>;
//# sourceMappingURL=rewardTriggerWorker.d.ts.map