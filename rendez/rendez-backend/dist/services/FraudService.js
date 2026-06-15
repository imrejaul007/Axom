"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
class FraudService {
    // Atomic increment-then-check — replaces the TOCTOU get-check+incr pattern.
    // Old flow: checkGiftSpam (read) → ... async work ... → incrementDailyGiftCount (write)
    // Concurrent requests all passed the read check before any incremented the counter.
    // New flow: increment first, check the new value, decrement+throw if over limit.
    // Callers must call this BEFORE issuing any wallet hold or voucher.
    async checkAndIncrementGiftSpam(senderId) {
        const key = `fraud:gifts:${senderId}:${this.todayKey()}`;
        const pipeline = redis_1.redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, 86400);
        const results = await pipeline.exec();
        const newCount = results?.[0]?.[1] ?? 1;
        if (newCount > env_1.env.FRAUD.MAX_GIFTS_PER_DAY) {
            // Roll back the increment so subsequent attempts see the correct count
            await redis_1.redis.decr(key);
            await this.flagUser(senderId, client_1.FraudType.GIFT_SPAM, 'Daily gift limit exceeded');
            throw new errorHandler_1.AppError(429, 'Daily gift limit reached');
        }
    }
    async checkRejectionPattern(senderId, receiverId) {
        const key = `fraud:rejections:${senderId}:${receiverId}`;
        const count = await redis_1.redis.incr(key);
        await redis_1.redis.expire(key, 30 * 86400);
        if (count >= 3) {
            await this.flagUser(senderId, client_1.FraudType.GIFT_SPAM, `Blocked from gifting ${receiverId} - 3 rejections`);
        }
    }
    async checkRewardFarming(user1Id, user2Id, bookingId) {
        const [u1, u2] = [user1Id, user2Id].sort();
        const recentReward = await database_1.prisma.reward.findFirst({
            where: {
                match: { OR: [{ user1Id: u1, user2Id: u2 }, { user1Id: u2, user2Id: u1 }] },
                status: 'TRIGGERED',
                triggeredAt: { gte: new Date(Date.now() - env_1.env.FRAUD.REWARD_COOLDOWN_DAYS * 86400 * 1000) },
            },
        });
        if (recentReward) {
            await Promise.all([
                this.flagUser(user1Id, client_1.FraudType.REWARD_FARMING, 'Reward cooldown not elapsed'),
                this.flagUser(user2Id, client_1.FraudType.REWARD_FARMING, 'Reward cooldown not elapsed'),
            ]);
            throw new errorHandler_1.AppError(403, 'Reward cooldown active for this match');
        }
    }
    async checkFakeCheckin(matchId, bookingId) {
        const match = await database_1.prisma.match.findUnique({ where: { id: matchId } });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const matchAge = (Date.now() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (matchAge < 7) {
            await Promise.all([
                this.flagUser(match.user1Id, client_1.FraudType.FAKE_CHECKIN, 'Match too new for meetup reward'),
                this.flagUser(match.user2Id, client_1.FraudType.FAKE_CHECKIN, 'Match too new for meetup reward'),
            ]);
            throw new errorHandler_1.AppError(403, 'Match must be at least 7 days old to earn meetup reward');
        }
    }
    async flagUser(userId, type, detail) {
        await database_1.prisma.fraudFlag.create({ data: { userId, type, detail } });
    }
    todayKey() {
        return new Date().toISOString().slice(0, 10);
    }
}
exports.FraudService = FraudService;
