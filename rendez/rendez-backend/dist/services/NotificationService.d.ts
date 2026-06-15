/**
 * NotificationService
 *
 * FCM data payloads are aligned with useDeepLink in the Rendez app:
 *   match   → { type, matchId, matchName }   → navigates to Chat
 *   message → { type, matchId, matchName }   → navigates to Chat
 *   gift    → { type, giftId }               → navigates to Gift Inbox
 *   meetup  → { type, matchId }              → navigates to Meetup screen
 *   reward  → { type }                       → navigates to Profile (wallet)
 *
 * C-2 FIX: Migrated from legacy FCM HTTP v1 (fcm.googleapis.com/fcm/send + server key)
 * to Firebase Admin SDK which uses OAuth 2.0 service account credentials and the
 * v1 messages:send endpoint. The legacy API was deprecated on June 20 2023.
 */
interface FcmPayload {
    to: string;
    notification: {
        title: string;
        body: string;
    };
    data: Record<string, string>;
    android?: {
        priority: 'high' | 'normal';
    };
}
export declare class NotificationService {
    /**
     * Check user notification preferences and send only if push is enabled.
     * Falls back to permissive (send) if preferences cannot be retrieved.
     */
    sendWithPreferences(userId: string, payload: FcmPayload): Promise<void>;
    private send;
    matchCreated(user1Token: string, user2Token: string, matchId: string, user1Name: string, user2Name: string): Promise<void>;
    matchNotify(token: string, matchId: string, otherName: string): Promise<void>;
    messageSent(receiverToken: string, senderName: string, matchId: string, preview: string): Promise<void>;
    giftReceived(receiverToken: string, senderName: string, giftId: string, giftDescription: string): Promise<void>;
    giftAccepted(senderToken: string, receiverName: string, matchId: string): Promise<void>;
    giftRejected(senderToken: string, receiverName: string, giftId: string): Promise<void>;
    meetupValidated(token1: string, token2: string, matchId: string, merchantName: string): Promise<void>;
    rewardTriggered(token1: string, token2: string): Promise<void>;
    planApplied(organizerToken: string, applicantName: string, planTitle: string, planId: string): Promise<void>;
    planSelected(applicantToken: string, organizerName: string, planTitle: string, matchId: string): Promise<void>;
    planExpired(organizerToken: string, planTitle: string, hadApplicants: boolean): Promise<void>;
    planGhostAlert(organizerToken: string, ghostName: string, planTitle: string, planId: string): Promise<void>;
    messageRequest(receiverToken: string, requestId: string, preview: string): Promise<void>;
    messageRequestAccepted(senderToken: string, matchId: string): Promise<void>;
    messageRequestDeclined(senderToken: string): Promise<void>;
    rewardFailed(token1: string, token2: string): Promise<void>;
}
export {};
//# sourceMappingURL=NotificationService.d.ts.map