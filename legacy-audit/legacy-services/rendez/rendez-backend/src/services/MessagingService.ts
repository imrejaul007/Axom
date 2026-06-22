import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { ChatState, MessageType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { log } from '../config/telemetry';
import { MessageRequestService } from './MessageRequestService';

const requestService = new MessageRequestService();

export class MessagingService {
  async sendMessage(senderId: string, matchId: string, content: string): Promise<object> {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: senderId }, { user2Id: senderId }], status: 'ACTIVE' },
      include: { messageState: true },
    });
    if (!match || !match.messageState) throw new AppError(404, 'Match not found');

    const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;

    // Sprint 12: If receiver requires message requests AND chat is still in initial state,
    // intercept and create a request instead of sending directly
    if (match.messageState.state === ChatState.MATCHED) {
      const receiver = await prisma.profile.findUnique({
        where: { id: receiverId },
        select: { requireMessageRequest: true },
      });
      if (receiver?.requireMessageRequest) {
        const result = await requestService.sendRequest(senderId, matchId, content);
        // Send push notification to receiver, respecting their preferences
        try {
          const fcmData = await redis.get(`fcm:${receiverId}`);
          if (fcmData) {
            const { fcmToken } = JSON.parse(fcmData);
            const prefsData = await redis.get(`notif_prefs:${receiverId}`);
            const prefs = prefsData ? JSON.parse(prefsData) : {};
            if (prefs.push !== false) {
              const { NotificationService } = await import('./NotificationService');
              const notifSvc = new NotificationService();
              notifSvc.messageRequest(fcmToken, result.requestId, content.slice(0, 80));
            }
          }
        } catch (notifErr) {
          log.error({ notifErr }, '[MessagingService] Push notification failed');
        }
        return { type: 'MESSAGE_REQUEST_SENT', requestId: result.requestId };
      }
    }

    const state = match.messageState;

    switch (state.state) {
      case ChatState.MATCHED: {
        if (state.freeMessageUsedBy) throw new AppError(403, 'Free message already used');
        const message = await prisma.$transaction(async (tx) => {
          const msg = await tx.message.create({
            data: { matchId, stateId: state.id, senderId, content, type: MessageType.FREE },
          });
          await tx.messageState.update({
            where: { id: state.id },
            data: {
              state: ChatState.FREE_MSG_SENT,
              freeMessageUsedBy: senderId,
              lastActivityAt: new Date(),
              expiresAt: new Date(Date.now() + env.FRAUD.MATCH_EXPIRY_HOURS * 3600 * 1000),
            },
          });
          return msg;
        });
        return message;
      }

      case ChatState.FREE_MSG_SENT:
      case ChatState.AWAITING_REPLY: {
        if (senderId === state.freeMessageUsedBy) {
          throw new AppError(403, 'MSG_LOCKED', );
        }
        // Receiver is replying — open the chat
        const message = await prisma.$transaction(async (tx) => {
          const msg = await tx.message.create({
            data: { matchId, stateId: state.id, senderId, content, type: MessageType.OPEN_CHAT },
          });
          await tx.messageState.update({
            where: { id: state.id },
            data: { state: ChatState.OPEN, lastActivityAt: new Date(), expiresAt: null },
          });
          return msg;
        });
        return message;
      }

      case ChatState.LOCKED:
        throw new AppError(403, 'MSG_LOCKED');

      case ChatState.GIFT_PENDING:
        throw new AppError(403, 'GIFT_PENDING_ACCEPTANCE');

      case ChatState.GIFT_UNLOCKED: {
        if (senderId !== state.freeMessageUsedBy) {
          // Receiver responding — open full chat
          const message = await prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
              data: { matchId, stateId: state.id, senderId, content, type: MessageType.OPEN_CHAT },
            });
            await tx.messageState.update({
              where: { id: state.id },
              data: { state: ChatState.OPEN, lastActivityAt: new Date() },
            });
            return msg;
          });
          return message;
        }
        // Original sender using their unlocked slot
        const message = await prisma.$transaction(async (tx) => {
          const msg = await tx.message.create({
            data: { matchId, stateId: state.id, senderId, content, type: MessageType.GIFT_UNLOCKED },
          });
          await tx.messageState.update({
            where: { id: state.id },
            data: { state: ChatState.AWAITING_REPLY, lastActivityAt: new Date() },
          });
          return msg;
        });
        return message;
      }

      case ChatState.OPEN: {
        const message = await prisma.message.create({
          data: { matchId, stateId: state.id, senderId, content, type: MessageType.OPEN_CHAT },
        });
        await prisma.messageState.update({
          where: { id: state.id },
          data: { lastActivityAt: new Date() },
        });
        return message;
      }

      default:
        throw new AppError(400, 'Invalid chat state');
    }
  }

  async getMessages(profileId: string, matchId: string, cursor?: string) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
      include: { messageState: true },
    });
    if (!match) throw new AppError(404, 'Match not found');

    const messages = await prisma.message.findMany({
      where: { stateId: match.messageState!.id, ...(cursor && { createdAt: { lt: new Date(cursor) } }) },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return { messages: messages.reverse(), state: match.messageState?.state };
  }

  async unlockFromGift(matchId: string): Promise<void> {
    const state = await prisma.messageState.findUnique({ where: { matchId } });
    if (!state) return;

    await prisma.messageState.update({
      where: { matchId },
      data: {
        state: ChatState.GIFT_UNLOCKED,
        giftUnlockCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  }

  async setGiftPending(matchId: string): Promise<void> {
    await prisma.messageState.update({
      where: { matchId },
      data: { state: ChatState.GIFT_PENDING, lastActivityAt: new Date() },
    });
  }

  async revertToLocked(matchId: string): Promise<void> {
    const state = await prisma.messageState.findUnique({ where: { matchId } });
    if (!state) return;
    // If a free message was sent, the chat was previously in LOCKED state (free exchange done,
    // gift required to continue). Revert to LOCKED. If no messages were exchanged at all,
    // revert to MATCHED (gift was sent without any prior message, return to initial state).
    const hadSentFreeMsg = !!state.freeMessageUsedBy;
    await prisma.messageState.update({
      where: { matchId },
      data: { state: hadSentFreeMsg ? ChatState.LOCKED : ChatState.MATCHED },
    });
  }
}
