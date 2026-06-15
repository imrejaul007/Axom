export declare class MessagingService {
    sendMessage(senderId: string, matchId: string, content: string): Promise<object>;
    getMessages(profileId: string, matchId: string, cursor?: string): Promise<{
        messages: any;
        state: any;
    }>;
    unlockFromGift(matchId: string): Promise<void>;
    setGiftPending(matchId: string): Promise<void>;
    revertToLocked(matchId: string): Promise<void>;
}
//# sourceMappingURL=MessagingService.d.ts.map