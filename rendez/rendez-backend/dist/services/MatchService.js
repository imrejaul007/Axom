"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const NotificationService_1 = require("./NotificationService");
const redis_1 = require("../config/redis");
const telemetry_1 = require("../config/telemetry");
const notifService = new NotificationService_1.NotificationService();
class MatchService {
    async sendLike(fromUserId, toUserId) {
        if (fromUserId === toUserId)
            throw new errorHandler_1.AppError(400, 'Cannot like yourself');
        const isBlocked = await database_1.prisma.block.findFirst({
            where: { OR: [{ blockerId: fromUserId, blockedId: toUserId }, { blockerId: toUserId, blockedId: fromUserId }] },
        });
        if (isBlocked)
            throw new errorHandler_1.AppError(403, 'Cannot like this user');
        // Sprint 12: verified-only safety checks
        const [sender, target] = await Promise.all([
            database_1.prisma.profile.findUnique({ where: { id: fromUserId }, select: { isVerified: true } }),
            database_1.prisma.profile.findUnique({ where: { id: toUserId }, select: { verifiedOnly: true, onlyVerifiedCanLike: true } }),
        ]);
        if (target?.verifiedOnly && !sender?.isVerified) {
            throw new errorHandler_1.AppError(403, 'VERIFIED_ONLY');
        }
        if (target?.onlyVerifiedCanLike && !sender?.isVerified) {
            throw new errorHandler_1.AppError(403, 'VERIFIED_ONLY');
        }
        const existing = await database_1.prisma.like.findUnique({ where: { fromUserId_toUserId: { fromUserId, toUserId } } });
        if (existing)
            return { matched: false };
        await database_1.prisma.like.create({ data: { fromUserId, toUserId } });
        // Check for mutual like
        const mutualLike = await database_1.prisma.like.findUnique({
            where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
        });
        if (!mutualLike)
            return { matched: false };
        // Create match
        const [user1Id, user2Id] = [fromUserId, toUserId].sort();
        const existingMatch = await database_1.prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id, user2Id } } });
        if (existingMatch)
            return { matched: true, matchId: existingMatch.id };
        const [fromUser, toUser] = await Promise.all([
            database_1.prisma.profile.findUnique({ where: { id: fromUserId }, select: { name: true, intent: true } }),
            database_1.prisma.profile.findUnique({ where: { id: toUserId }, select: { name: true, intent: true } }),
        ]);
        let match;
        try {
            match = await database_1.prisma.match.create({
                data: {
                    user1Id,
                    user2Id,
                    intentType: toUser?.intent || client_1.Intent.DATING,
                    messageState: { create: {} },
                },
            });
        }
        catch (err) {
            // P2002 = unique constraint violation — concurrent mutual like created the match first
            if (err.code === 'P2002') {
                const existing = await database_1.prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id, user2Id } } });
                if (existing)
                    return { matched: true, matchId: existing.id };
            }
            throw err;
        }
        // Fire FCM notifications best-effort
        const [token1Raw, token2Raw] = await Promise.all([
            redis_1.redis.get(`fcm:${fromUserId}`),
            redis_1.redis.get(`fcm:${toUserId}`),
        ]);
        const token1 = token1Raw
            ? (() => { try {
                return JSON.parse(token1Raw).fcmToken;
            }
            catch {
                return null;
            } })()
            : null;
        const token2 = token2Raw
            ? (() => { try {
                return JSON.parse(token2Raw).fcmToken;
            }
            catch {
                return null;
            } })()
            : null;
        // Send notifications independently — one user not having a push token must
        // not prevent the other user from receiving their match notification.
        if (token1) {
            notifService.matchNotify(token1, match.id, toUser?.name || '').catch((err) => {
                telemetry_1.log.error({ err, profileId: fromUserId }, '[MatchService] Match notification failed for user 1');
            });
        }
        if (token2) {
            notifService.matchNotify(token2, match.id, fromUser?.name || '').catch((err) => {
                telemetry_1.log.error({ err, profileId: toUserId }, '[MatchService] Match notification failed for user 2');
            });
        }
        return { matched: true, matchId: match.id };
    }
    async getMatches(profileId) {
        const matches = await database_1.prisma.match.findMany({
            where: {
                OR: [{ user1Id: profileId }, { user2Id: profileId }],
                status: 'ACTIVE',
            },
            include: {
                user1: { select: { id: true, name: true, photos: true, age: true, city: true, isVerified: true } },
                user2: { select: { id: true, name: true, photos: true, age: true, city: true, isVerified: true } },
                messageState: {
                    select: { state: true, lastActivityAt: true, id: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const stateIds = matches.map((m) => m.messageState?.id).filter(Boolean);
        if (stateIds.length === 0) {
            return matches.map((m) => ({ ...m, lastMessage: null, unreadCount: 0 }));
        }
        // Batch fetch last messages + unread counts in 2 queries instead of 2N
        const [allMessages, unreadGroups] = await Promise.all([
            database_1.prisma.message.findMany({
                where: { stateId: { in: stateIds } },
                orderBy: { createdAt: 'desc' },
                select: { stateId: true, content: true, senderId: true, createdAt: true, type: true },
            }),
            database_1.prisma.message.groupBy({
                by: ['stateId'],
                where: { stateId: { in: stateIds }, read: false, senderId: { not: profileId } },
                _count: { id: true },
            }),
        ]);
        // Pick first (most recent) message per stateId — already desc sorted
        const lastMsgByState = new Map();
        for (const msg of allMessages) {
            if (!lastMsgByState.has(msg.stateId))
                lastMsgByState.set(msg.stateId, msg);
        }
        const unreadByState = new Map(unreadGroups.map((r) => [r.stateId, r._count.id]));
        const enriched = matches.map((m) => {
            const stateId = m.messageState?.id;
            const lastMsg = stateId ? lastMsgByState.get(stateId) : undefined;
            const unreadCount = stateId ? (unreadByState.get(stateId) ?? 0) : 0;
            return {
                ...m,
                lastMessage: lastMsg
                    ? { preview: lastMsg.content.slice(0, 60), senderId: lastMsg.senderId, createdAt: lastMsg.createdAt }
                    : null,
                unreadCount,
            };
        });
        // Sort: unread first, then by last activity
        return enriched.sort((a, b) => {
            if (b.unreadCount !== a.unreadCount)
                return b.unreadCount - a.unreadCount;
            const aTime = a.lastMessage?.createdAt ?? new Date(a.createdAt);
            const bTime = b.lastMessage?.createdAt ?? new Date(b.createdAt);
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
    }
    async unmatch(profileId, matchId) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        // RZ-B-M3 FIX: Clean up MessageRequest entries and reset the MessageState within the
        // same transaction so stale records don't persist after unmatching.
        await database_1.prisma.$transaction([
            database_1.prisma.messageRequest.deleteMany({ where: { matchId } }),
            database_1.prisma.match.update({ where: { id: matchId }, data: { status: 'UNMATCHED' } }),
        ]);
    }
}
exports.MatchService = MatchService;
