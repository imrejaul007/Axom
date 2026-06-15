"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhookVerify_1 = require("../../middleware/webhookVerify");
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const RewardService_1 = require("../../services/RewardService");
const telemetry_1 = require("../../config/telemetry");
const router = (0, express_1.Router)();
const rewardService = new RewardService_1.RewardService();
// Gift redeemed at merchant
router.post('/gift-redeemed', webhookVerify_1.verifyRezWebhook, async (req, res, next) => {
    try {
        const { voucher_id } = req.body;
        if (!voucher_id) {
            res.status(400).json({ success: false, message: 'voucher_id required' });
            return;
        }
        const updated = await database_1.prisma.gift.updateMany({
            where: { rezVoucherId: voucher_id },
            data: { status: client_1.GiftStatus.REDEEMED },
        });
        if (updated.count === 0) {
            res.status(404).json({ success: false, message: 'Gift not found' });
            return;
        }
        res.json({ received: true });
    }
    catch (err) {
        telemetry_1.log.error({ err }, '[GiftRedeemed] Error');
        res.status(500).json({ success: false, message: 'Gift redemption failed' });
    }
});
// Gift expired — refund already handled by REZ, just update status
router.post('/gift-expired', webhookVerify_1.verifyRezWebhook, async (req, res, next) => {
    try {
        const { voucher_id } = req.body;
        const gift = await database_1.prisma.gift.findFirst({ where: { rezVoucherId: voucher_id } });
        if (gift) {
            await database_1.prisma.gift.update({
                where: { id: gift.id },
                data: { status: client_1.GiftStatus.EXPIRED },
            });
        }
        res.json({ received: true });
    }
    catch (err) {
        next(err);
    }
});
// Payment completed at REZ merchant — start reward validation
// RZ-B-C2 FIX: Use atomic updateMany to claim the reward inside the transaction.
// This eliminates the race condition where two concurrent webhooks could both pass
// the PENDING check and issue duplicate rewards.
router.post('/payment-completed', webhookVerify_1.verifyRezWebhook, async (req, res, next) => {
    try {
        const { booking_id } = req.body;
        if (!booking_id) {
            res.status(400).json({ received: false, message: 'booking_id required' });
            return;
        }
        // Verify both check-ins are present before claiming the reward
        const checkins = await database_1.prisma.meetupCheckin.findMany({ where: { bookingId: booking_id } });
        if (checkins.length < 2) {
            res.json({ received: true });
            return;
        }
        // Atomic claim: update PENDING → TRIGGERED inside transaction. Only ONE concurrent
        // webhook can win; all others find 0 updated rows and return early.
        const updated = await database_1.prisma.$transaction(async (tx) => {
            const claimed = await tx.reward.updateMany({
                where: { bookingId: booking_id, status: 'PENDING' },
                data: { status: 'TRIGGERED' },
            });
            if (claimed.count === 0)
                return null;
            const reward = await tx.reward.findFirst({ where: { bookingId: booking_id } });
            return reward;
        });
        if (!updated) {
            // Either no reward record or already triggered — idempotent, safe to return 200
            res.json({ received: true });
            return;
        }
        await rewardService.triggerMeetupReward({ matchId: updated.matchId, bookingId: booking_id });
        res.json({ received: true });
    }
    catch (err) {
        telemetry_1.log.error({ err }, '[PaymentCompleted] Error');
        res.status(500).json({ received: false, message: 'Internal error' });
    }
});
// Reward triggered by REZ — notify users
router.post('/reward-triggered', webhookVerify_1.verifyRezWebhook, async (req, res, next) => {
    try {
        const { reward_id } = req.body;
        await database_1.prisma.reward.updateMany({
            where: { rezRewardRef: reward_id },
            data: { status: 'TRIGGERED', triggeredAt: new Date() },
        });
        res.json({ received: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
