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
exports.RewardService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const FraudService_1 = require("./FraudService");
const rezReward = __importStar(require("../integrations/rez/rezRewardClient"));
const fraud = new FraudService_1.FraudService();
class RewardService {
    async triggerMeetupReward(params) {
        const match = await database_1.prisma.match.findUnique({
            where: { id: params.matchId },
            include: {
                user1: { select: { rezUserId: true } },
                user2: { select: { rezUserId: true } },
            },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        // Guard: both users must have a linked REZ account to receive rewards
        if (!match.user1.rezUserId || !match.user2.rezUserId) {
            throw new errorHandler_1.AppError(422, 'One or both users have not linked a REZ account — reward cannot be issued');
        }
        await fraud.checkRewardFarming(match.user1Id, match.user2Id, params.bookingId);
        await fraud.checkFakeCheckin(params.matchId, params.bookingId);
        const existingReward = await database_1.prisma.reward.findFirst({
            where: { matchId: params.matchId, bookingId: params.bookingId },
        });
        if (existingReward)
            return;
        const rewardRecord = await database_1.prisma.reward.create({
            data: { matchId: params.matchId, bookingId: params.bookingId, user1Id: match.user1Id, user2Id: match.user2Id },
        });
        try {
            const result = await rezReward.triggerMeetupReward({
                booking_id: params.bookingId,
                user1_rez_id: match.user1.rezUserId,
                user2_rez_id: match.user2.rezUserId,
                match_id: params.matchId,
            });
            await database_1.prisma.reward.update({
                where: { id: rewardRecord.id },
                data: { status: 'TRIGGERED', rezRewardRef: result.reward_id, triggeredAt: new Date() },
            });
        }
        catch (err) {
            await database_1.prisma.reward.update({ where: { id: rewardRecord.id }, data: { status: 'FAILED' } });
            throw err;
        }
    }
}
exports.RewardService = RewardService;
