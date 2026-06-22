import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { FraudType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export class FraudService {
  // Atomic increment-then-check — replaces the TOCTOU get-check+incr pattern.
  // Old flow: checkGiftSpam (read) → ... async work ... → incrementDailyGiftCount (write)
  // Concurrent requests all passed the read check before any incremented the counter.
  // New flow: increment first, check the new value, decrement+throw if over limit.
  // Callers must call this BEFORE issuing any wallet hold or voucher.
  async checkAndIncrementGiftSpam(senderId: string): Promise<void> {
    const key = `fraud:gifts:${senderId}:${this.todayKey()}`;
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 86400);
    const results = await pipeline.exec();
    const newCount = (results?.[0]?.[1] as number) ?? 1;
    if (newCount > env.FRAUD.MAX_GIFTS_PER_DAY) {
      // Roll back the increment so subsequent attempts see the correct count
      await redis.decr(key);
      await this.flagUser(senderId, FraudType.GIFT_SPAM, 'Daily gift limit exceeded');
      throw new AppError(429, 'Daily gift limit reached');
    }
  }

  async checkRejectionPattern(senderId: string, receiverId: string): Promise<void> {
    const key = `fraud:rejections:${senderId}:${receiverId}`;
    const count = await redis.incr(key);
    await redis.expire(key, 30 * 86400);
    if (count >= 3) {
      await this.flagUser(senderId, FraudType.GIFT_SPAM, `Blocked from gifting ${receiverId} - 3 rejections`);
    }
  }

  async checkRewardFarming(user1Id: string, user2Id: string, bookingId: string): Promise<void> {
    const [u1, u2] = [user1Id, user2Id].sort();

    const recentReward = await prisma.reward.findFirst({
      where: {
        match: { OR: [{ user1Id: u1, user2Id: u2 }, { user1Id: u2, user2Id: u1 }] },
        status: 'TRIGGERED',
        triggeredAt: { gte: new Date(Date.now() - env.FRAUD.REWARD_COOLDOWN_DAYS * 86400 * 1000) },
      },
    });

    if (recentReward) {
      await Promise.all([
        this.flagUser(user1Id, FraudType.REWARD_FARMING, 'Reward cooldown not elapsed'),
        this.flagUser(user2Id, FraudType.REWARD_FARMING, 'Reward cooldown not elapsed'),
      ]);
      throw new AppError(403, 'Reward cooldown active for this match');
    }
  }

  async checkFakeCheckin(matchId: string, bookingId: string): Promise<void> {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new AppError(404, 'Match not found');

    const matchAge = (Date.now() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (matchAge < 7) {
      await Promise.all([
        this.flagUser(match.user1Id, FraudType.FAKE_CHECKIN, 'Match too new for meetup reward'),
        this.flagUser(match.user2Id, FraudType.FAKE_CHECKIN, 'Match too new for meetup reward'),
      ]);
      throw new AppError(403, 'Match must be at least 7 days old to earn meetup reward');
    }
  }

  private async flagUser(userId: string, type: FraudType, detail: string): Promise<void> {
    await prisma.fraudFlag.create({ data: { userId, type, detail } });
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
