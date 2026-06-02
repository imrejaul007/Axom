/**
 * RTMN Commerce Memory: Intent Capture Service for Rendez
 * Connects Rendez social intents to cross-app commerce intelligence
 */
export interface CaptureProfileViewParams {
    userId: string;
    viewedUserId: string;
    intent: 'DATING' | 'FRIENDSHIP' | 'NETWORKING';
}
export interface CaptureMatchReceivedParams {
    userId: string;
    matchId: string;
    matchedUserId: string;
    intent: 'DATING' | 'FRIENDSHIP' | 'NETWORKING';
}
export interface CaptureMatchAcceptedParams {
    userId: string;
    matchId: string;
    matchedUserId: string;
}
export interface CaptureDatePlannedParams {
    userId: string;
    matchId: string;
    venue?: string;
    dateType: string;
}
export interface CaptureDateCompletedParams {
    userId: string;
    matchId: string;
    rating?: number;
    review?: string;
}
/**
 * Capture profile view intent (cross-app commerce signal)
 */
export declare function captureProfileView(params: CaptureProfileViewParams): Promise<void>;
/**
 * Capture match received intent
 */
export declare function captureMatchReceived(params: CaptureMatchReceivedParams): Promise<void>;
/**
 * Capture match accepted intent
 */
export declare function captureMatchAccepted(params: CaptureMatchAcceptedParams): Promise<void>;
/**
 * Capture date planned intent (strong commerce signal)
 */
export declare function captureDatePlanned(params: CaptureDatePlannedParams): Promise<void>;
/**
 * Capture date completed intent (purchase signal for restaurants/entertainment)
 */
export declare function captureDateCompleted(params: CaptureDateCompletedParams): Promise<void>;
/**
 * Capture profile created intent (initial profile registration)
 */
export declare function captureProfileCreated(params: {
    userId: string;
    profileId: string;
    intent?: 'DATING' | 'FRIENDSHIP' | 'NETWORKING';
}): Promise<void>;
/**
 * Capture message sent intent
 */
export declare function captureMessageSent(params: {
    userId: string;
    matchId: string;
    messageId: string;
    content?: string;
}): Promise<void>;
/**
 * Capture meetup/booking created intent
 */
export declare function captureMeetupCreated(params: {
    userId: string;
    matchId: string;
    bookingId: string;
    merchantId?: string;
    date?: string;
}): Promise<void>;
/**
 * Capture subscription started intent
 */
export declare function captureSubscriptionStarted(params: {
    userId: string;
    planId: string;
    planName?: string;
}): Promise<void>;
export declare const intentCaptureService: {
    captureProfileView: typeof captureProfileView;
    captureMatchReceived: typeof captureMatchReceived;
    captureMatchAccepted: typeof captureMatchAccepted;
    captureDatePlanned: typeof captureDatePlanned;
    captureDateCompleted: typeof captureDateCompleted;
    captureProfileCreated: typeof captureProfileCreated;
    captureMessageSent: typeof captureMessageSent;
    captureMeetupCreated: typeof captureMeetupCreated;
    captureSubscriptionStarted: typeof captureSubscriptionStarted;
};
//# sourceMappingURL=intentCapture.service.d.ts.map