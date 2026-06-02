export interface GiftCatalogItem {
    id: string;
    name: string;
    description: string;
    amount_paise: number;
    merchant_name: string;
    merchant_logo_url: string;
    category: string;
    validity_days: number;
    tier: 'signal' | 'coffee' | 'treat' | 'experience' | 'exclusive';
    city: string;
}
export interface IssueVoucherResult {
    voucher_id: string;
    qr_code_url: string;
    expires_at: string;
}
export declare function getCatalog(city?: string): Promise<GiftCatalogItem[]>;
export declare function issueVoucher(params: {
    catalog_item_id: string;
    sender_rez_id: string;
    receiver_rez_id: string;
    hold_id: string;
    idempotency_key: string;
}): Promise<IssueVoucherResult>;
export declare function activateVoucher(voucherId: string): Promise<void>;
export declare function cancelVoucher(voucherId: string, reason: string): Promise<void>;
export declare function getVoucher(voucherId: string): Promise<{
    qr_code_url: string;
    status: string;
    merchant_name: string;
    valid_until: string;
}>;
//# sourceMappingURL=rezGiftClient.d.ts.map