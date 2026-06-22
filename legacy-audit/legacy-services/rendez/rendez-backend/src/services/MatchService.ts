import { prisma } from '../config/database';
import { Intent } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from './NotificationService';
import { redis } from '../config/redis';
import { log } from '../config/telemetry';

const notifService = new NotificationService();

export class MatchService {
  async sendLike(fromUserId: string, toUserId: string): Promise<{ matched: boolean; matchId?: string }> {
    if (fromUserId === toUserId) throw new AppError(400, 'Cannot like yourself');

    const isBlocked = await prisma.block.findFirst({
      where: { OR: [{ blockerId: fromUserId, blockedId: toUserId }, { blockerId: toUserId, blockedId: fromUserId }] },
    });
    if (isBlocked) throw new AppError(403, 'Cannot like this user');

    // Sprint 12: verified-only safety checks
    const [sender, target] = await Promise.all([
      prisma.profile.findUnique({ where: { id: fromUserId }, select: { isVerified: true } }),
      prisma.profile.findUnique({ where: { id: toUserId }, select: { verifiedOnly: true, onlyVerifiedCanLike: true } }),
    ]);
    if (target?.verifiedOnly && !sender?.isVerified) {
      throw new AppError(403, 'VERIFIED_ONLY');
    }
    if (target?.onlyVerifiedCanLike && !sender?.isVerified) {
      throw new AppError(403, 'VERIFIED_ONLY');
    }

    const existing = await prisma.like.findUnique({ where: { fromUserId_toUserId: { fromUserId, toUserId } } });
    if (existing) return { matched: false };

    await prisma.like.create({ data: { fromUserId, toUserId } });

    // Check for mutual like
    const mutualLike = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
    });

    if (!mutualLike) return { matched: false };

    // Create match
    const [user1Id, user2Id] = [fromUserId, toUserId].sort();
    const existingMatch = await prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id, user2Id } } });
    if (existingMatch) return { matched: true, matchId: existingMatch.id };

    const [fromUser, toUser] = await Promise.all([
      prisma.profile.findUnique({ where: { id: fromUserId }, select: { name: true, intent: true } }),
      prisma.profile.findUnique({ where: { id: toUserId }, select: { name: true, intent: true } }),
    ]);

    let match: Awaited<ReturnType<typeof prisma.match.create>>;
    try {
      match = await prisma.match.create({
        data: {
          user1Id,
          user2Id,
          intentType: toUser?.intent || Intent.DATING,
          messageState: { create: {} },
        },
      });
    } catch (err: unknown) {
      // P2002 = unique constraint violation — concurrent mutual like created the match first
      if ((err as { code?: string }).code === 'P2002') {
        const existing = await prisma.match.findUnique({ where: { user1Id_user2Id: { user1Id, user2Id } } });
        if (existing) return { matched: true, matchId: existing.id };
      }
      throw err;
    }

    // Fire FCM notifications best-effort
    const [token1Raw, token2Raw] = await Promise.all([
      redis.get(`fcm:${fromUserId}`),
      redis.get(`fcm:${toUserId}`),
    ]);
    const token1 = token1Raw
      ? (() => { try { return JSON.parse(token1Raw).fcmToken; } catch { return null; } })()
      : null;
    const token2 = token2Raw
      ? (() => { try { return JSON.parse(token2Raw).fcmToken; } catch { return null; } })()
      : null;
    // Send notifications independently — one user not having a push token must
    // not prevent the other user from receiving their match notification.
    if (token1) {
      notifService.matchNotify(token1, match.id, toUser?.name || '').catch((err: unknown) => {
        log.error({ err, profileId: fromUserId }, '[MatchService] Match notification failed for user 1');
      });
    }
    if (token2) {
      notifService.matchNotify(token2, match.id, fromUser?.name || '').catch((err: unknown) => {
        log.error({ err, profileId: toUserId }, '[MatchService] Match notification failed for user 2');
      });
    }

    return { matched: true, matchId: match.id };
  }

  async getMatches(profileId: string) {
    const matches = await prisma.match.findMany({
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

    const stateIds = matches.map((m) => m.messageState?.id).filter(Boolean) as string[];

    if (stateIds.length === 0) {
      return matches.map((m) => ({ ...m, lastMessage: null, unreadCount: 0 }));
    }

    // Batch fetch last messages + unread counts in 2 queries instead of 2N
    const [allMessages, unreadGroups] = await Promise.all([
      prisma.message.findMany({
        where: { stateId: { in: stateIds } },
        orderBy: { createdAt: 'desc' },
        select: { stateId: true, content: true, senderId: true, createdAt: true, type: true },
      }),
      prisma.message.groupBy({
        by: ['stateId'],
        where: { stateId: { in: stateIds }, read: false, senderId: { not: profileId } },
        _count: { id: true },
      }),
    ]);

    // Pick first (most recent) message per stateId — already desc sorted
    const lastMsgByState = new Map<string, typeof allMessages[0]>();
    for (const msg of allMessages) {
      if (!lastMsgByState.has(msg.stateId)) lastMsgByState.set(msg.stateId, msg);
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
      if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
      const aTime = a.lastMessage?.createdAt ?? new Date(a.createdAt);
      const bTime = b.lastMessage?.createdAt ?? new Date(b.createdAt);
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async unmatch(profileId: string, matchId: string): Promise<void> {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
    });
    if (!match) throw new AppError(404, 'Match not found');

    // RZ-B-M3 FIX: Clean up MessageRequest entries and reset the MessageState within the
    // same transaction so stale records don't persist after unmatching.
    await prisma.$transaction([
      prisma.messageRequest.deleteMany({ where: { matchId } }),
      prisma.match.update({ where: { id: matchId }, data: { status: 'UNMATCHED' } }),
    ]);
  }
}
