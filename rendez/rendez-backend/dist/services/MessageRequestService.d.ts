/**
 * MessageRequestService — handles the chat request queue for female safety controls.
 *
 * Flow:
 *   1. Sender tries to send first message to someone who has requireMessageRequest=true
 *   2. Instead of a direct message, a MessageRequest is created with a 200-char preview
 *   3. Receiver sees request in their inbox, can Accept or Decline
 *   4. On Accept → chat state transitions to OPEN (full access)
 *   5. On Decline → sender gets an AppError on next send attempt (request is DECLINED)
 *   6. Each accept bumps receiver.responseRate up; each decline bumps it up too
 *      (decline is a valid response — absence of response drags it down via a cron job)
 */
export declare class MessageRequestService {
    /**
     * Send a chat request (preview only — not a real message yet).
     * Called from MessagingService when the receiver has requireMessageRequest=true.
     */
    sendRequest(senderId: string, matchId: string, previewText: string): Promise<{
        requestId: string;
    }>;
    /**
     * Receiver accepts → transition chat to OPEN, update responseRate
     */
    acceptRequest(receiverId: string, requestId: string): Promise<void>;
    /**
     * Receiver declines → mark declined, gently nudge shadowScore of sender.
     * RZ-B-M11 FIX: Add a daily decline rate limit (max 20 declines/day) to prevent
     * gaming of the shadowScore. Only increment shadowScore if within the limit.
     * Also log notification failures (RZ-B-M7).
     */
    declineRequest(receiverId: string, requestId: string): Promise<void>;
    /**
     * Get pending requests for the receiver (their inbox)
     * RZ-B-M5 FIX: Added cursor-based pagination to prevent loading all requests
     * into memory on large inboxes. Defaults to 20 items per page.
     */
    getInbox(receiverId: string, cursor?: string, take?: number): Promise<{
        requests: object[];
        nextCursor?: string;
    }>;
}
//# sourceMappingURL=MessageRequestService.d.ts.map