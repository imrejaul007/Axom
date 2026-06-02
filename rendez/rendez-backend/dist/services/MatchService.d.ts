export declare class MatchService {
    sendLike(fromUserId: string, toUserId: string): Promise<{
        matched: boolean;
        matchId?: string;
    }>;
    getMatches(profileId: string): Promise<any>;
    unmatch(profileId: string, matchId: string): Promise<void>;
}
//# sourceMappingURL=MatchService.d.ts.map