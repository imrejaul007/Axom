export declare class ExperienceCreditService {
    grant(params: {
        rezRewardId: string;
        rezUserId: string;
        tier: 'SILVER' | 'GOLD' | 'PLATINUM';
        type: 'COFFEE_BRUNCH' | 'DINNER_FOR_TWO' | 'PREMIUM_EXPERIENCE';
        label: string;
        expiresAt: Date;
    }): Promise<any>;
    getAvailable(profileId: string): Promise<any>;
    getAll(profileId: string): Promise<any>;
    markUsed(creditId: string, planId: string, profileId: string): Promise<any>;
    private _notifyRezUsed;
    expireStale(): Promise<void>;
}
//# sourceMappingURL=ExperienceCreditService.d.ts.map