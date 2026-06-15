/**
 * REZ Mind Service - Rendez Integration
 * Sends social/booking events to REZ Mind Event Platform
 */
interface BookingEvent {
    user_id: string;
    booking_id: string;
    service_type: string;
    merchant_id?: string;
    amount?: number;
}
/**
 * Send booking event to REZ Mind (fire-and-forget)
 */
export declare function sendBookingToRezMind(booking: BookingEvent): Promise<void>;
/**
 * Send profile view event to REZ Mind
 */
export declare function sendProfileViewToRezMind(data: {
    user_id: string;
    profile_id: string;
    action: string;
}): Promise<void>;
export {};
//# sourceMappingURL=rezMindService.d.ts.map