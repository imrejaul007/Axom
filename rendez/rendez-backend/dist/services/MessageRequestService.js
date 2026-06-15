"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRequestService = void 0;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const NotificationService_1 = require("./NotificationService");
const redis_1 = require("../config/redis");
const telemetry_1 = require("../config/telemetry");
const notif = new NotificationService_1.NotificationService();
class MessageRequestService {
    /**
     * Send a chat request (preview only — not a real message yet).
     * Called from MessagingService when the receiver has requireMessageRequest=true.
     */
    async sendRequest(senderId, matchId, previewText) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: matchId, OR: [{ user1Id: senderId }, { user2Id: senderId }], status: 'ACTIVE' },
            include: { messageState: true },
        });
        if (!match || !match.messageState)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;
        // Only allowed in MATCHED / FREE_MSG_SENT (initial contact states)
        const allowedStates = [client_1.ChatState.MATCHED, client_1.ChatState.FREE_MSG_SENT];
        if (!allowedStates.includes(match.messageState.state)) {
            throw new errorHandler_1.AppError(400, 'Chat request not needed — conversation is already open');
        }
        // Idempotent — return existing pending request if already sent
        const existing = await database_1.prisma.messageRequest.findUnique({
            where: { matchId_senderId: { matchId, senderId } },
        });
        if (existing) {
            if (existing.status === client_1.MessageRequestStatus.DECLINED) {
                throw new errorHandler_1.AppError(403, 'REQUEST_DECLINED');
            }
            return { requestId: existing.id };
        }
        const request = await database_1.prisma.messageRequest.create({
            data: {
                matchId,
                senderId,
                receiverId,
                previewText: previewText.slice(0, 200),
            },
        });
        // Fire FCM to receiver
        const fcmRaw = await redis_1.redis.get(`fcm:${receiverId}`);
        const fcmToken = fcmRaw ? JSON.parse(fcmRaw).fcmToken : null;
        if (fcmToken) {
            await notif.messageRequest(fcmToken, request.id, previewText.slice(0, 60)).catch((err) => {
                telemetry_1.log.error({ err, requestId: request.id }, '[MessageRequestService] messageRequest notification failed');
            });
        }
        return { requestId: request.id };
    }
    /**
     * Receiver accepts → transition chat to OPEN, update responseRate
     */
    async acceptRequest(receiverId, requestId) {
        const request = await database_1.prisma.messageRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== receiverId)
            throw new errorHandler_1.AppError(404, 'Request not found');
        // RZ-B-M9 FIX: Distinguish between already accepted vs already declined.
        if (request.status === client_1.MessageRequestStatus.ACCEPTED) {
            throw new errorHandler_1.AppError(409, 'Request was already accepted');
        }
        if (request.status !== client_1.MessageRequestStatus.PENDING) {
            throw new errorHandler_1.AppError(409, 'Request was already declined');
        }
        await database_1.prisma.$transaction([
            database_1.prisma.messageRequest.update({
                where: { id: requestId },
                data: { status: client_1.MessageRequestStatus.ACCEPTED, respondedAt: new Date() },
            }),
            database_1.prisma.messageState.update({
                where: { matchId: request.matchId },
                data: { state: client_1.ChatState.OPEN, lastActivityAt: new Date(), expiresAt: null },
            }),
            // Bump responseRate toward 1.0 (exponential moving average)
            database_1.prisma.$executeRaw `
        UPDATE profiles SET "responseRate" = LEAST(1.0, "responseRate" * 0.8 + 0.2)
        WHERE id = ${receiverId}
      `,
        ]);
        // Notify sender that request was accepted
        const fcmRaw = await redis_1.redis.get(`fcm:${request.senderId}`);
        const fcmToken = fcmRaw ? JSON.parse(fcmRaw).fcmToken : null;
        if (fcmToken) {
            await notif.messageRequestAccepted(fcmToken, request.matchId);
        }
    }
    /**
     * Receiver declines → mark declined, gently nudge shadowScore of sender.
     * RZ-B-M11 FIX: Add a daily decline rate limit (max 20 declines/day) to prevent
     * gaming of the shadowScore. Only increment shadowScore if within the limit.
     * Also log notification failures (RZ-B-M7).
     */
    async declineRequest(receiverId, requestId) {
        const request = await database_1.prisma.messageRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== receiverId)
            throw new errorHandler_1.AppError(404, 'Request not found');
        // RZ-B-M9 FIX: Distinguish already-accepted vs already-declined.
        if (request.status === client_1.MessageRequestStatus.DECLINED) {
            throw new errorHandler_1.AppError(409, 'Request was already declined');
        }
        if (request.status !== client_1.MessageRequestStatus.PENDING) {
            throw new errorHandler_1.AppError(409, 'Request was already accepted');
        }
        // RZ-B-M11 FIX: Rate limit on decline to prevent shadowScore gaming.
        const dailyKey = `decline_limit:${receiverId}:${new Date().toISOString().slice(0, 10)}`;
        const countRaw = await redis_1.redis.get(dailyKey);
        const count = countRaw ? parseInt(countRaw, 10) : 0;
        const MAX_DECLINES_PER_DAY = 20;
        if (count >= MAX_DECLINES_PER_DAY) {
            throw new errorHandler_1.AppError(429, `Daily decline limit reached (${MAX_DECLINES_PER_DAY}). Try again tomorrow.`);
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.messageRequest.update({
                where: { id: requestId },
                data: { status: client_1.MessageRequestStatus.DECLINED, respondedAt: new Date() },
            });
            // Receiver response rate goes up (responded = good)
            await tx.$executeRaw `
        UPDATE profiles SET "responseRate" = LEAST(1.0, "responseRate" * 0.8 + 0.2)
        WHERE id = ${receiverId}
      `;
            // Sender's shadow score increases only if within daily rate limit
            if (count < MAX_DECLINES_PER_DAY) {
                await tx.$executeRaw `
          UPDATE profiles SET "shadowScore" = LEAST(100.0, "shadowScore" + 2.0)
          WHERE id = ${request.senderId}
        `;
            }
        });
        // Update rate limit counter (after transaction to avoid race)
        await redis_1.redis.incr(dailyKey);
        if (count === 0) {
            // Set expiry to end of day (max 24h)
            const ttl = Math.ceil((24 * 3600 - (Date.now() % (24 * 3600))) / 1000);
            await redis_1.redis.expire(dailyKey, ttl);
        }
        // RZ-B-M7 FIX: Log notification failures (was fire-and-forget with no logging).
        try {
            const fcmRaw = await redis_1.redis.get(`fcm:${request.senderId}`);
            const fcmToken = fcmRaw ? JSON.parse(fcmRaw).fcmToken : null;
            if (fcmToken) {
                await notif.messageRequestDeclined(fcmToken).catch((err) => {
                    telemetry_1.log.warn({ err }, '[MessageRequest] Failed to notify sender of decline');
                });
            }
        }
        catch (err) {
            telemetry_1.log.warn({ err }, '[MessageRequest] FCM lookup failed');
        }
    }
    /**
     * Get pending requests for the receiver (their inbox)
     * RZ-B-M5 FIX: Added cursor-based pagination to prevent loading all requests
     * into memory on large inboxes. Defaults to 20 items per page.
     */
    async getInbox(receiverId, cursor, take = 20) {
        const requests = await database_1.prisma.messageRequest.findMany({
            where: { receiverId, status: client_1.MessageRequestStatus.PENDING },
            orderBy: { createdAt: 'desc' },
            take: take + 1, // fetch one extra to determine if there's a next page
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                sender: {
                    select: { id: true, name: true, age: true, photos: true, city: true, isVerified: true, bio: true },
                },
            },
        });
        const hasNext = requests.length > take;
        const items = hasNext ? requests.slice(0, -1) : requests;
        const nextCursor = hasNext ? items[items.length - 1]?.id : undefined;
        return { requests: items, nextCursor };
    }
}
exports.MessageRequestService = MessageRequestService;
