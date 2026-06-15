/**
 * Trust signals — computed from raw profile fields to produce human-legible signals.
 * Surfaced in the discover feed and profile detail to help women identify trustworthy
 * profiles at a glance.
 *
 * RD-M-11 FIX: Moved from src/routes/profile.ts to a dedicated utils module so
 * DiscoveryService can import it without depending on a route file.
 */
export type TrustLevel = 'UNVERIFIED' | 'VERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD';
export type ResponseLabel = 'SLUGGISH' | 'SLOW' | 'RESPONSIVE' | 'QUICK' | 'LIKELY_TO_REPLY';
export type ActiveLabel = 'ACTIVE_TODAY' | 'ACTIVE_THIS_WEEK' | 'ACTIVE_THIS_MONTH' | 'INACTIVE';
export interface TrustSignals {
    trustLevel: TrustLevel;
    trustLevelLabel: string;
    responseLabel: ResponseLabel;
    responsePercent: number;
    activeLabel: ActiveLabel;
    lastActiveAt: Date | null;
    profileCompleteness: number;
}
export declare function computeTrustSignals(p: {
    isVerified: boolean;
    meetupCount: number;
    responseRate: number;
    lastActiveAt: Date;
    photos: string[];
    bio: string | null;
}): TrustSignals;
//# sourceMappingURL=trust.d.ts.map