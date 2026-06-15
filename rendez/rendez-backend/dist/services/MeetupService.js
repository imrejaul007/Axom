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
exports.MeetupService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const ReferralService_1 = require("./ReferralService");
const redis_1 = require("../config/redis");
const rezMerchant = __importStar(require("../integrations/rez/rezMerchantClient"));
const queue_1 = require("../jobs/queue");
const referral = new ReferralService_1.ReferralService();
class MeetupService {
    async suggestMerchants(profileId, matchId) {
        const profile = await database_1.prisma.profile.findUnique({ where: { id: profileId }, select: { lat: true, lng: true, city: true } });
        if (!profile?.lat || !profile?.lng)
            throw new errorHandler_1.AppError(400, 'Location not set — update your city/location in profile');
        return rezMerchant.getNearbyMerchants({ lat: profile.lat, lng: profile.lng });
    }
    async getNearbyMerchants(lat, lng) {
        return rezMerchant.getNearbyMerchants({ lat, lng });
    }
    async createBooking(params) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: params.matchId, OR: [{ user1Id: params.profileId }, { user2Id: params.profileId }], status: 'ACTIVE' },
            include: {
                user1: { select: { rezUserId: true } },
                user2: { select: { rezUserId: true } },
            },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const booking = await rezMerchant.createBooking({
            merchant_id: params.merchantId,
            user1_rez_id: match.user1.rezUserId,
            user2_rez_id: match.user2.rezUserId,
            date: params.date,
            party_size: params.partySize,
        });
        // Cache booking → match mapping for fast checkin lookup
        await redis_1.redis.setex(`booking:${booking.booking_id}`, 48 * 3600, params.matchId);
        return booking;
    }
    async checkin(params) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: params.matchId, OR: [{ user1Id: params.profileId }, { user2Id: params.profileId }] },
            include: {
                user1: { select: { id: true } },
                user2: { select: { id: true } },
            },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const bookingMatchId = await redis_1.redis.get(`booking:${params.bookingId}`);
        if (!bookingMatchId || bookingMatchId !== params.matchId) {
            throw new errorHandler_1.AppError(400, 'Booking does not belong to this match');
        }
        const existing = await database_1.prisma.meetupCheckin.findUnique({
            where: { matchId_userId: { matchId: params.matchId, userId: params.profileId } },
        });
        if (existing)
            return { validated: false, alreadyCheckedIn: true, message: 'You already checked in — waiting for your match' };
        await database_1.prisma.meetupCheckin.create({
            data: {
                matchId: params.matchId,
                bookingId: params.bookingId,
                rezMerchantId: params.merchantId,
                userId: params.profileId,
            },
        });
        const checkins = await database_1.prisma.meetupCheckin.findMany({
            where: { matchId: params.matchId, bookingId: params.bookingId },
        });
        const bothPresent = checkins.length >= 2;
        if (bothPresent) {
            // Sort by checkedInAt to ensure deterministic timeDiff regardless of DB return order
            const sorted = checkins.slice().sort((a, b) => a.checkedInAt.getTime() - b.checkedInAt.getTime());
            const timeDiff = sorted[1].checkedInAt.getTime() - sorted[0].checkedInAt.getTime();
            if (timeDiff > 30 * 60 * 1000)
                throw new errorHandler_1.AppError(400, 'Check-in window expired (30 min) — both must scan within 30 minutes');
            // RZ-B-H3 FIX: Use BullMQ job queue for reward trigger instead of fire-and-forget.
            // RZ-B-H4 FIX: Increase lock TTL from 5 min to 30 min to handle slow network operations
            // during the reward trigger process (multiple DB ops + external API calls).
            const lockKey = `reward_lock:${params.matchId}:${params.bookingId}`;
            const LOCK_TTL_SECONDS = 1800; // 30 minutes
            const acquired = await redis_1.redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
            if (acquired === 'OK') {
                // Queue the reward trigger with built-in retries (3 attempts, exponential backoff).
                // This replaces the fire-and-forget .catch() pattern that silently swallowed errors.
                await queue_1.rewardTriggerQueue.add('trigger-meetup-reward', {
                    matchId: params.matchId,
                    bookingId: params.bookingId,
                    user1Id: match.user1Id,
                    user2Id: match.user2Id,
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                });
            }
            return { validated: true, bothCheckedIn: true, message: 'Meetup validated! Reward coins incoming 🎉' };
        }
        return { validated: false, bothCheckedIn: false, message: 'Checked in! Waiting for your match to scan their QR' };
    }
    async getMeetupStatus(profileId, matchId) {
        const match = await database_1.prisma.match.findFirst({
            where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const checkins = await database_1.prisma.meetupCheckin.findMany({ where: { matchId } });
        const rewardRecord = await database_1.prisma.reward.findFirst({ where: { matchId } });
        const myCheckin = checkins.find((c) => c.userId === profileId);
        const partnerCheckin = checkins.find((c) => c.userId !== profileId);
        return {
            myCheckedIn: !!myCheckin,
            partnerCheckedIn: !!partnerCheckin,
            bothCheckedIn: checkins.length >= 2,
            validated: checkins.length >= 2,
            reward: rewardRecord
                ? { status: rewardRecord.status, triggeredAt: rewardRecord.triggeredAt }
                : null,
        };
    }
}
exports.MeetupService = MeetupService;
