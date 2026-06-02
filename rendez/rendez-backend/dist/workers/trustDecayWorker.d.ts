/**
 * trustDecayWorker — runs daily, decays shadowScore for users who
 * have started responding to message requests (keeping the score
 * from permanently suppressing rehabilitated users).
 *
 * Decay rule:
 *   newScore = max(0, shadowScore * 0.85)
 *   Only update profiles where shadowScore > 0.1 (skip near-zero)
 *
 * Also resets responseRate toward 1.0 for long-inactive users so
 * old non-responses don't permanently tank their ranking.
 */
import { Worker } from 'bullmq';
export declare const trustDecayWorker: Worker<any, void, string>;
//# sourceMappingURL=trustDecayWorker.d.ts.map