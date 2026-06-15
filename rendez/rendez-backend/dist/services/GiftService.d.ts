import { GiftType } from '@prisma/client';
export declare class GiftService {
    getCatalog(city?: string): Promise<object[]>;
    sendGift(params: {
        senderId: string;
        receiverId: string;
        matchId: string;
        giftType: GiftType;
        amountPaise: number;
        rezCatalogItemId?: string;
        message?: string;
        senderRezId: string;
        receiverRezId: string;
    }): Promise<object>;
    acceptGift(receiverId: string, giftId: string, receiverRezId: string): Promise<object>;
    rejectGift(receiverId: string, giftId: string): Promise<void>;
    getVoucher(profileId: string, giftId: string): Promise<object>;
    private getGiftAttemptNumber;
    private adjustAmountForAttempt;
}
//# sourceMappingURL=GiftService.d.ts.map