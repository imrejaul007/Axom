export interface KarmaProfile {
    userId: string;
    lifetimeKarma: number;
    activeKarma: number;
    level: 'L1' | 'L2' | 'L3' | 'L4';
    trustScore: number;
    eventsCompleted: number;
    badges: Array<{
        id: string;
        name: string;
        earnedAt: string;
    }>;
}
export interface KarmaBadge {
    id: string;
    name: string;
    icon: string;
}
/** Known badge ID → display info mapping */
export declare const KARMA_BADGE_MAP: Record<string, KarmaBadge>;
/**
 * Fetch karma profile for a user by their ReZ user ID.
 * Returns null if the user has no karma profile (not yet used Karma).
 * Never throws — callers handle null gracefully.
 */
export declare function getKarmaProfile(rezUserId: string): Promise<KarmaProfile | null>;
//# sourceMappingURL=rezKarmaClient.d.ts.map