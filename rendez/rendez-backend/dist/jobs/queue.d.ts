import { Queue } from 'bullmq';
export declare const sponsorCreditQueue: Queue<any, any, string, any, any, string>;
export declare const giftExpiryQueue: Queue<any, any, string, any, any, string>;
export declare const giftExpiryDLQ: Queue<any, any, string, any, any, string>;
export declare const matchExpiryQueue: Queue<any, any, string, any, any, string>;
export declare const catalogCacheQueue: Queue<any, any, string, any, any, string>;
export declare const planExpiryQueue: Queue<any, any, string, any, any, string>;
export declare const ghostDetectQueue: Queue<any, any, string, any, any, string>;
export declare const autoCancelQueue: Queue<any, any, string, any, any, string>;
export declare const trustDecayQueue: Queue<any, any, string, any, any, string>;
export declare const rewardTriggerQueue: Queue<any, any, string, any, any, string>;
export declare function startRecurringJobs(): Promise<void>;
//# sourceMappingURL=queue.d.ts.map