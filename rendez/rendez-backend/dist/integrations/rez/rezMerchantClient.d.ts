export interface NearbyMerchant {
    merchant_id: string;
    name: string;
    category: string;
    address: string;
    distance_km: number;
    rating: number;
    photo_url?: string;
}
export interface BookingResult {
    booking_id: string;
    confirmation_code: string;
}
export declare function getNearbyMerchants(params: {
    lat: number;
    lng: number;
    radius_km?: number;
}): Promise<NearbyMerchant[]>;
export declare function createBooking(params: {
    merchant_id: string;
    user1_rez_id: string;
    user2_rez_id: string;
    date: string;
    party_size: number;
}): Promise<BookingResult>;
//# sourceMappingURL=rezMerchantClient.d.ts.map