export interface TriggerRewardResult {
    reward_id: string;
    user1_coins: number;
    user2_coins: number;
}
export declare function triggerMeetupReward(params: {
    booking_id: string;
    user1_rez_id: string;
    user2_rez_id: string;
    match_id: string;
}): Promise<TriggerRewardResult>;
//# sourceMappingURL=rezRewardClient.d.ts.map