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
exports.GiftService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
const rezWallet = __importStar(require("../integrations/rez/rezWalletClient"));
const rezGift = __importStar(require("../integrations/rez/rezGiftClient"));
const MessagingService_1 = require("./MessagingService");
const FraudService_1 = require("./FraudService");
const uuid_1 = require("uuid");
const telemetry_1 = require("../config/telemetry");
const messaging = new MessagingService_1.MessagingService();
const fraud = new FraudService_1.FraudService();
class GiftService {
    async getCatalog(city) {
        const safeCitySlug = /^[a-z0-9-]{1,50}$/.test(city || '') ? city : 'all';
        const cacheKey = `gift:catalog:${safeCitySlug}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const items = await rezGift.getCatalog(city);
        await redis_1.redis.setex(cacheKey, env_1.env.GIFT_CATALOG_CACHE_TTL, JSON.stringify(items));
        return items;
    }
    async sendGift(params) {
        await fraud.checkAndIncrementGiftSpam(params.senderId);
        const match = await database_1.prisma.match.findFirst({
            where: { id: params.matchId, OR: [{ user1Id: params.senderId }, { user2Id: params.senderId }], status: 'ACTIVE' },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        const attemptNumber = await this.getGiftAttemptNumber(params.senderId, params.receiverId);
        const adjustedAmount = this.adjustAmountForAttempt(params.amountPaise, attemptNumber);
        const idempotencyKey = (0, uuid_1.v4)();
        // Create the DB record FIRST in PENDING state so we have a reference if REZ calls fail.
        // This prevents orphaned wallet holds (hold exists in REZ but no DB record to refund it).
        const gift = await database_1.prisma.gift.create({
            data: {
                senderId: params.senderId,
                receiverId: params.receiverId,
                matchId: params.matchId,
                giftType: params.giftType,
                amountPaise: adjustedAmount,
                rezCatalogItemId: params.rezCatalogItemId,
                message: params.message,
                attemptNumber,
                expiresAt: new Date(Date.now() + env_1.env.FRAUD.GIFT_EXPIRY_HOURS * 3600 * 1000),
            },
        });
        let holdResult;
        try {
            holdResult = await rezWallet.holdWallet({
                rez_user_id: params.senderRezId,
                amount_paise: adjustedAmount,
                idempotency_key: idempotencyKey,
                reason: 'rendez_gift',
            });
        }
        catch (err) {
            // REZ wallet hold failed — cancel the DB record immediately
            await database_1.prisma.gift.update({ where: { id: gift.id }, data: { status: client_1.GiftStatus.CANCELLED } });
            throw err;
        }
        let rezVoucherId;
        let merchantName;
        let merchantLogoUrl;
        if (params.giftType === client_1.GiftType.MERCHANT_VOUCHER && params.rezCatalogItemId) {
            try {
                const voucher = await rezGift.issueVoucher({
                    catalog_item_id: params.rezCatalogItemId,
                    sender_rez_id: params.senderRezId,
                    receiver_rez_id: params.receiverRezId,
                    hold_id: holdResult.hold_id,
                    idempotency_key: idempotencyKey,
                });
                rezVoucherId = voucher.voucher_id;
                const catalogItems = await this.getCatalog();
                const item = catalogItems.find((i) => i.id === params.rezCatalogItemId);
                merchantName = item?.merchant_name;
                merchantLogoUrl = item?.merchant_logo_url;
            }
            catch (err) {
                // Voucher failed — refund the hold and cancel the gift
                await rezWallet.refundHold(holdResult.hold_id, 'voucher_issue_failed').catch((err) => telemetry_1.log.error({ hold_id: holdResult.hold_id, err }, '[GiftService] refundHold failed'));
                await database_1.prisma.gift.update({ where: { id: gift.id }, data: { status: client_1.GiftStatus.CANCELLED } });
                throw err;
            }
        }
        // Update gift record with REZ references
        await database_1.prisma.gift.update({
            where: { id: gift.id },
            data: { rezHoldId: holdResult.hold_id, rezVoucherId, merchantName, merchantLogoUrl },
        });
        await messaging.setGiftPending(params.matchId);
        // incrementDailyGiftCount removed — fraud.checkAndIncrementGiftSpam() at the
        // top of this method now handles both the check and the increment atomically.
        return gift;
    }
    async acceptGift(receiverId, giftId, receiverRezId) {
        // Atomic TOCTOU fix: use updateMany with the PENDING guard so concurrent calls
        // only one succeeds — the second finds 0 matching rows and throws 409.
        const atomicUpdate = await database_1.prisma.gift.updateMany({
            where: { id: giftId, receiverId, status: client_1.GiftStatus.PENDING },
            data: { status: client_1.GiftStatus.ACCEPTED, acceptedAt: new Date(), messageUnlocked: true },
        });
        if (atomicUpdate.count === 0)
            throw new errorHandler_1.AppError(404, 'Gift not found or already actioned');
        const updated = await database_1.prisma.gift.findUnique({ where: { id: giftId } });
        if (!updated)
            throw new errorHandler_1.AppError(404, 'Gift not found');
        const gift = updated;
        try {
            if (gift.rezVoucherId) {
                await rezGift.activateVoucher(gift.rezVoucherId);
            }
            else if (gift.rezHoldId) {
                await rezWallet.releaseHold(gift.rezHoldId, receiverRezId);
            }
        }
        catch (err) {
            // C-5 FIX: REZ transfer failed — revert the ACCEPTED status so the gift can be retried,
            // log a structured audit entry, and re-throw so the HTTP layer returns a proper error
            // to the client instead of silently swallowing the failure.
            telemetry_1.log.error({ giftId, err }, '[GiftService] acceptGift REZ call failed');
            // Compensating transaction: revert to PENDING so accept can be retried
            await database_1.prisma.gift.update({
                where: { id: giftId },
                data: { status: client_1.GiftStatus.PENDING, acceptedAt: null, messageUnlocked: false },
            }).catch((revertErr) => {
                telemetry_1.log.error({ giftId, revertErr }, '[GiftService] CRITICAL: failed to revert gift after REZ error');
            });
            throw new errorHandler_1.AppError(502, 'Gift transfer failed. Please try again or contact support.');
        }
        await messaging.unlockFromGift(gift.matchId);
        return { success: true, voucherId: updated.rezVoucherId };
    }
    async rejectGift(receiverId, giftId) {
        // Atomic status update first — eliminates TOCTOU race where two concurrent
        // rejection requests both pass findFirst(PENDING) and both trigger refundHold,
        // causing a double-refund on the REZ wallet hold.
        const atomicUpdate = await database_1.prisma.gift.updateMany({
            where: { id: giftId, receiverId, status: client_1.GiftStatus.PENDING },
            data: { status: client_1.GiftStatus.REJECTED, rejectedAt: new Date() },
        });
        if (atomicUpdate.count === 0)
            throw new errorHandler_1.AppError(404, 'Gift not found or already actioned');
        const gift = await database_1.prisma.gift.findUnique({ where: { id: giftId } });
        if (!gift)
            throw new errorHandler_1.AppError(404, 'Gift not found');
        if (gift.rezHoldId)
            await rezWallet.refundHold(gift.rezHoldId, 'gift_rejected');
        await messaging.revertToLocked(gift.matchId);
        await fraud.checkRejectionPattern(gift.senderId, gift.receiverId);
    }
    async getVoucher(profileId, giftId) {
        const gift = await database_1.prisma.gift.findFirst({
            where: { id: giftId, receiverId: profileId, status: client_1.GiftStatus.ACCEPTED },
        });
        if (!gift || !gift.rezVoucherId)
            throw new errorHandler_1.AppError(404, 'Voucher not found');
        return rezGift.getVoucher(gift.rezVoucherId);
    }
    async getGiftAttemptNumber(senderId, receiverId) {
        const count = await database_1.prisma.gift.count({ where: { senderId, receiverId } });
        return count + 1;
    }
    adjustAmountForAttempt(basePaise, attempt) {
        if (attempt >= 4)
            throw new errorHandler_1.AppError(403, 'Gift limit reached for this match');
        if (attempt === 3)
            return basePaise * 2;
        if (attempt === 2)
            return Math.floor(basePaise * 1.5);
        return basePaise;
    }
}
exports.GiftService = GiftService;
