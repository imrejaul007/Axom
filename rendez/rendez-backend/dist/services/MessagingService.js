"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
const telemetry_1 = require("../config/telemetry");
const MessageRequestService_1 = require("./MessageRequestService");
const requestService = new MessageRequestService_1.MessageRequestService();
class MessagingService {
    async sendMessage(senderId, matchId, content) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: matchId, OR: [{ user1Id: senderId }, { user2Id: senderId }], status: 'ACTIVE' },
            include: { messageState: true },
        });
        if (!match || !match.messageState)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;
        // Sprint 12: If receiver requires message requests AND chat is still in initial state,
        // intercept and create a request instead of sending directly
        if (match.messageState.state === client_1.ChatState.MATCHED) {
            const receiver = await database_1.prisma.profile.findUnique({
                where: { id: receiverId },
                select: { requireMessageRequest: true },
            });
            if (receiver?.requireMessageRequest) {
                const result = await requestService.sendRequest(senderId, matchId, content);
                // Send push notification to receiver, respecting their preferences
                try {
                    const fcmData = await redis_1.redis.get(`fcm:${receiverId}`);
                    if (fcmData) {
                        const { fcmToken } = JSON.parse(fcmData);
                        const prefsData = await redis_1.redis.get(`notif_prefs:${receiverId}`);
                        const prefs = prefsData ? JSON.parse(prefsData) : {};
                        if (prefs.push !== false) {
                            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('./NotificationService')));
                            const notifSvc = new NotificationService();
                            notifSvc.messageRequest(fcmToken, result.requestId, content.slice(0, 80));
                        }
                    }
                }
                catch (notifErr) {
                    telemetry_1.log.error({ notifErr }, '[MessagingService] Push notification failed');
                }
                return { type: 'MESSAGE_REQUEST_SENT', requestId: result.requestId };
            }
        }
        const state = match.messageState;
        switch (state.state) {
            case client_1.ChatState.MATCHED: {
                if (state.freeMessageUsedBy)
                    throw new errorHandler_1.AppError(403, 'Free message already used');
                const message = await database_1.prisma.$transaction(async (tx) => {
                    const msg = await tx.message.create({
                        data: { matchId, stateId: state.id, senderId, content, type: client_1.MessageType.FREE },
                    });
                    await tx.messageState.update({
                        where: { id: state.id },
                        data: {
                            state: client_1.ChatState.FREE_MSG_SENT,
                            freeMessageUsedBy: senderId,
                            lastActivityAt: new Date(),
                            expiresAt: new Date(Date.now() + env_1.env.FRAUD.MATCH_EXPIRY_HOURS * 3600 * 1000),
                        },
                    });
                    return msg;
                });
                return message;
            }
            case client_1.ChatState.FREE_MSG_SENT:
            case client_1.ChatState.AWAITING_REPLY: {
                if (senderId === state.freeMessageUsedBy) {
                    throw new errorHandler_1.AppError(403, 'MSG_LOCKED');
                }
                // Receiver is replying — open the chat
                const message = await database_1.prisma.$transaction(async (tx) => {
                    const msg = await tx.message.create({
                        data: { matchId, stateId: state.id, senderId, content, type: client_1.MessageType.OPEN_CHAT },
                    });
                    await tx.messageState.update({
                        where: { id: state.id },
                        data: { state: client_1.ChatState.OPEN, lastActivityAt: new Date(), expiresAt: null },
                    });
                    return msg;
                });
                return message;
            }
            case client_1.ChatState.LOCKED:
                throw new errorHandler_1.AppError(403, 'MSG_LOCKED');
            case client_1.ChatState.GIFT_PENDING:
                throw new errorHandler_1.AppError(403, 'GIFT_PENDING_ACCEPTANCE');
            case client_1.ChatState.GIFT_UNLOCKED: {
                if (senderId !== state.freeMessageUsedBy) {
                    // Receiver responding — open full chat
                    const message = await database_1.prisma.$transaction(async (tx) => {
                        const msg = await tx.message.create({
                            data: { matchId, stateId: state.id, senderId, content, type: client_1.MessageType.OPEN_CHAT },
                        });
                        await tx.messageState.update({
                            where: { id: state.id },
                            data: { state: client_1.ChatState.OPEN, lastActivityAt: new Date() },
                        });
                        return msg;
                    });
                    return message;
                }
                // Original sender using their unlocked slot
                const message = await database_1.prisma.$transaction(async (tx) => {
                    const msg = await tx.message.create({
                        data: { matchId, stateId: state.id, senderId, content, type: client_1.MessageType.GIFT_UNLOCKED },
                    });
                    await tx.messageState.update({
                        where: { id: state.id },
                        data: { state: client_1.ChatState.AWAITING_REPLY, lastActivityAt: new Date() },
                    });
                    return msg;
                });
                return message;
            }
            case client_1.ChatState.OPEN: {
                const message = await database_1.prisma.message.create({
                    data: { matchId, stateId: state.id, senderId, content, type: client_1.MessageType.OPEN_CHAT },
                });
                await database_1.prisma.messageState.update({
                    where: { id: state.id },
                    data: { lastActivityAt: new Date() },
                });
                return message;
            }
            default:
                throw new errorHandler_1.AppError(400, 'Invalid chat state');
        }
    }
    async getMessages(profileId, matchId, cursor) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
            include: { messageState: true },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const messages = await database_1.prisma.message.findMany({
            where: { stateId: match.messageState.id, ...(cursor && { createdAt: { lt: new Date(cursor) } }) },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        return { messages: messages.reverse(), state: match.messageState?.state };
    }
    async unlockFromGift(matchId) {
        const state = await database_1.prisma.messageState.findUnique({ where: { matchId } });
        if (!state)
            return;
        await database_1.prisma.messageState.update({
            where: { matchId },
            data: {
                state: client_1.ChatState.GIFT_UNLOCKED,
                giftUnlockCount: { increment: 1 },
                lastActivityAt: new Date(),
            },
        });
    }
    async setGiftPending(matchId) {
        await database_1.prisma.messageState.update({
            where: { matchId },
            data: { state: client_1.ChatState.GIFT_PENDING, lastActivityAt: new Date() },
        });
    }
    async revertToLocked(matchId) {
        const state = await database_1.prisma.messageState.findUnique({ where: { matchId } });
        if (!state)
            return;
        // If a free message was sent, the chat was previously in LOCKED state (free exchange done,
        // gift required to continue). Revert to LOCKED. If no messages were exchanged at all,
        // revert to MATCHED (gift was sent without any prior message, return to initial state).
        const hadSentFreeMsg = !!state.freeMessageUsedBy;
        await database_1.prisma.messageState.update({
            where: { matchId },
            data: { state: hadSentFreeMsg ? client_1.ChatState.LOCKED : client_1.ChatState.MATCHED },
        });
    }
}
exports.MessagingService = MessagingService;
