export interface HoldResult {
    hold_id: string;
    balance_after: number;
}
export interface WalletBalance {
    balance_paise: number;
    coin_balance: number;
}
/** Stable idempotency key for a coin credit operation.
 * Format: credit:{reason}:{rezUserId}:{coins}:{timestamp_bucket}
 * The 60-second bucket prevents double-credit on rapid retries while still
 * allowing genuine re-attempts after the window expires. */
export declare function creditIdempotencyKey(params: {
    reason: string;
    rezUserId: string;
    coins: number;
    meta?: Record<string, unknown>;
}): string;
export declare function holdWallet(params: {
    rez_user_id: string;
    amount_paise: number;
    idempotency_key: string;
    reason: string;
}): Promise<HoldResult>;
export declare function releaseHold(holdId: string, recipientRezUserId: string): Promise<void>;
export declare function refundHold(holdId: string, reason: string): Promise<void>;
export declare function getBalance(rezUserId: string): Promise<WalletBalance>;
export declare function refundBooking(rezBookingRef: string, reason: string): Promise<void>;
export declare function creditCoins(params: {
    rezUserId: string;
    coins: number;
    reason: string;
    meta?: Record<string, unknown>;
    idempotencyKey?: string;
}): Promise<void>;
export declare function creditMeetupBonus(bookingId: string, participants: Array<{
    rezUserId: string;
    coins: number;
}>): Promise<void>;
export declare function issuePlanCredit(organizerRezUserId: string, rezBookingRef: string, ttlDays: number): Promise<void>;
//# sourceMappingURL=rezWalletClient.d.ts.map