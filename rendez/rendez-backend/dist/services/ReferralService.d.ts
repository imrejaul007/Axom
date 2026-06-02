/**
 * ReferralService
 *
 * Invite flow:
 *   1. User A shares their inviteCode (deep link: rendez://invite/{code})
 *   2. User B opens the link → app stores the code and passes it at profile creation
 *   3. On profile create, we stamp referredBy = code, increment referrer.referralCount
 *   4. When User B completes their FIRST validated meetup, User A earns 100 REZ coins
 *      (credited via REZ wallet API — fire-and-forget, non-blocking)
 *
 * Coin value: 100 coins ≈ ₹10 (merchant can use toward next booking)
 */
export declare class ReferralService {
    /** Return the caller's invite code and full deep link */
    getMyCode(profileId: string): Promise<{
        code: any;
        link: string;
        referralCount: any;
    }>;
    /**
     * Validate and stamp an invite code at profile creation time.
     * Called from profile POST if body contains referralCode.
     * RZ-B-B3 FIX: Only increment referrer's count after the referred user completes
     * profile creation (name, photo, age). A profile with no name/photo is a ghost
     * signup — we don't want to inflate the referrer's count with abandoned signups.
     * Returns the referrer profileId (used to credit later) or null.
     */
    applyCode(newProfileId: string, code: string): Promise<string | null>;
    /**
     * Credit referrer when a referred user completes their FIRST meetup.
     * Called from MeetupService._triggerRewardAndNotify after both users check in.
     * RZ-B-B2 FIX: Uses a Redis distributed lock to prevent double-crediting if two
     * concurrent checkins from the same device trigger this method simultaneously.
     * Fire-and-forget — never throws to caller.
     */
    creditReferrerIfEligible(newUserId: string): Promise<void>;
}
//# sourceMappingURL=ReferralService.d.ts.map