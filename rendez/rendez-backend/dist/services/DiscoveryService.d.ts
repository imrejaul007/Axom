import { Intent } from '@prisma/client';
interface DiscoveryFilters {
    city?: string;
    minAge?: number;
    maxAge?: number;
    intent?: Intent;
}
export declare class DiscoveryService {
    getFeed(profileId: string, filters?: DiscoveryFilters): Promise<object[]>;
    private computeScore;
    private distanceScore;
    private activityScore;
    private completenessScore;
    invalidateFeed(profileId: string): Promise<void>;
}
export {};
//# sourceMappingURL=DiscoveryService.d.ts.map