export interface RendezContext {
    userId: string;
    profileId: string;
    preferences: {
        minAge?: number;
        maxAge?: number;
        distance?: number;
        interests?: string[];
    };
}
export interface RendezAction {
    type: 'view_matches' | 'plan_date' | 'book_restaurant' | 'nearby_events' | 'update_profile' | 'send_message' | 'view_messages';
    payload?: Record<string, unknown>;
}
export declare class RendezChatHandler {
    /**
     * Handle Rendez-specific chat actions
     */
    handleAction(action: RendezAction, context: RendezContext): Promise<{
        success: boolean;
        data?: unknown;
        message: string;
    }>;
    private handleViewMatches;
    private handlePlanDate;
    private handleBookRestaurant;
    private handleNearbyEvents;
    private handleUpdateProfile;
    private handleSendMessage;
    private handleViewMessages;
}
export declare const rendezChatHandler: RendezChatHandler;
export default rendezChatHandler;
//# sourceMappingURL=rendezChatService.d.ts.map