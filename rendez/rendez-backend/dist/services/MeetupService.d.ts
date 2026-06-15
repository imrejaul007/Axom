import * as rezMerchant from '../integrations/rez/rezMerchantClient';
export declare class MeetupService {
    suggestMerchants(profileId: string, matchId: string): Promise<rezMerchant.NearbyMerchant[]>;
    getNearbyMerchants(lat: number, lng: number): Promise<rezMerchant.NearbyMerchant[]>;
    createBooking(params: {
        profileId: string;
        matchId: string;
        merchantId: string;
        date: string;
        partySize: number;
    }): Promise<rezMerchant.BookingResult>;
    checkin(params: {
        profileId: string;
        matchId: string;
        bookingId: string;
        merchantId: string;
    }): Promise<{
        validated: boolean;
        alreadyCheckedIn: boolean;
        message: string;
        bothCheckedIn?: undefined;
    } | {
        validated: boolean;
        bothCheckedIn: boolean;
        message: string;
        alreadyCheckedIn?: undefined;
    }>;
    getMeetupStatus(profileId: string, matchId: string): Promise<{
        myCheckedIn: boolean;
        partnerCheckedIn: boolean;
        bothCheckedIn: boolean;
        validated: boolean;
        reward: {
            status: any;
            triggeredAt: any;
        } | null;
    }>;
}
//# sourceMappingURL=MeetupService.d.ts.map