export declare class FraudService {
    checkAndIncrementGiftSpam(senderId: string): Promise<void>;
    checkRejectionPattern(senderId: string, receiverId: string): Promise<void>;
    checkRewardFarming(user1Id: string, user2Id: string, bookingId: string): Promise<void>;
    checkFakeCheckin(matchId: string, bookingId: string): Promise<void>;
    private flagUser;
    private todayKey;
}
//# sourceMappingURL=FraudService.d.ts.map