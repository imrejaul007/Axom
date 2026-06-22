import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { GiftType, GiftStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import * as rezWallet from '../integrations/rez/rezWalletClient';
import * as rezGift from '../integrations/rez/rezGiftClient';
import { MessagingService } from './MessagingService';
import { FraudService } from './FraudService';
import { v4 as uuid } from 'uuid';
import { log } from '../config/telemetry';

const messaging = new MessagingService();
const fraud = new FraudService();

export class GiftService {
  async getCatalog(city?: string): Promise<object[]> {
    const safeCitySlug = /^[a-z0-9-]{1,50}$/.test(city || '') ? city : 'all';
    const cacheKey = `gift:catalog:${safeCitySlug}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const items = await rezGift.getCatalog(city);
    await redis.setex(cacheKey, env.GIFT_CATALOG_CACHE_TTL, JSON.stringify(items));
    return items;
  }

  async sendGift(params: {
    senderId: string;
    receiverId: string;
    matchId: string;
    giftType: GiftType;
    amountPaise: number;
    rezCatalogItemId?: string;
    message?: string;
    senderRezId: string;
    receiverRezId: string;
  }): Promise<object> {
    await fraud.checkAndIncrementGiftSpam(params.senderId);

    const match = await prisma.match.findFirst({
      where: { id: params.matchId, OR: [{ user1Id: params.senderId }, { user2Id: params.senderId }], status: 'ACTIVE' },
    });
    if (!match) throw new AppError(404, 'Match not found');

    const attemptNumber = await this.getGiftAttemptNumber(params.senderId, params.receiverId);
    const adjustedAmount = this.adjustAmountForAttempt(params.amountPaise, attemptNumber);

    const idempotencyKey = uuid();

    // Create the DB record FIRST in PENDING state so we have a reference if REZ calls fail.
    // This prevents orphaned wallet holds (hold exists in REZ but no DB record to refund it).
    const gift = await prisma.gift.create({
      data: {
        senderId: params.senderId,
        receiverId: params.receiverId,
        matchId: params.matchId,
        giftType: params.giftType,
        amountPaise: adjustedAmount,
        rezCatalogItemId: params.rezCatalogItemId,
        message: params.message,
        attemptNumber,
        expiresAt: new Date(Date.now() + env.FRAUD.GIFT_EXPIRY_HOURS * 3600 * 1000),
      },
    });

    let holdResult: Awaited<ReturnType<typeof rezWallet.holdWallet>>;
    try {
      holdResult = await rezWallet.holdWallet({
        rez_user_id: params.senderRezId,
        amount_paise: adjustedAmount,
        idempotency_key: idempotencyKey,
        reason: 'rendez_gift',
      });
    } catch (err) {
      // REZ wallet hold failed — cancel the DB record immediately
      await prisma.gift.update({ where: { id: gift.id }, data: { status: GiftStatus.CANCELLED } });
      throw err;
    }

    let rezVoucherId: string | undefined;
    let merchantName: string | undefined;
    let merchantLogoUrl: string | undefined;

    if (params.giftType === GiftType.MERCHANT_VOUCHER && params.rezCatalogItemId) {
      try {
        const voucher = await rezGift.issueVoucher({
          catalog_item_id: params.rezCatalogItemId,
          sender_rez_id: params.senderRezId,
          receiver_rez_id: params.receiverRezId,
          hold_id: holdResult.hold_id,
          idempotency_key: idempotencyKey,
        });
        rezVoucherId = voucher.voucher_id;

        const catalogItems = await this.getCatalog() as rezGift.GiftCatalogItem[];
        const item = catalogItems.find((i) => i.id === params.rezCatalogItemId);
        merchantName = item?.merchant_name;
        merchantLogoUrl = item?.merchant_logo_url;
      } catch (err) {
        // Voucher failed — refund the hold and cancel the gift
        await rezWallet.refundHold(holdResult.hold_id, 'voucher_issue_failed').catch((err: unknown) => log.error({ hold_id: holdResult.hold_id, err }, '[GiftService] refundHold failed'));
        await prisma.gift.update({ where: { id: gift.id }, data: { status: GiftStatus.CANCELLED } });
        throw err;
      }
    }

    // Update gift record with REZ references
    await prisma.gift.update({
      where: { id: gift.id },
      data: { rezHoldId: holdResult.hold_id, rezVoucherId, merchantName, merchantLogoUrl },
    });

    await messaging.setGiftPending(params.matchId);
    // incrementDailyGiftCount removed — fraud.checkAndIncrementGiftSpam() at the
    // top of this method now handles both the check and the increment atomically.

    return gift;
  }

  async acceptGift(receiverId: string, giftId: string, receiverRezId: string): Promise<object> {
    // Atomic TOCTOU fix: use updateMany with the PENDING guard so concurrent calls
    // only one succeeds — the second finds 0 matching rows and throws 409.
    const atomicUpdate = await prisma.gift.updateMany({
      where: { id: giftId, receiverId, status: GiftStatus.PENDING },
      data: { status: GiftStatus.ACCEPTED, acceptedAt: new Date(), messageUnlocked: true },
    });
    if (atomicUpdate.count === 0) throw new AppError(404, 'Gift not found or already actioned');

    const updated = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!updated) throw new AppError(404, 'Gift not found');
    const gift = updated;

    try {
      if (gift.rezVoucherId) {
        await rezGift.activateVoucher(gift.rezVoucherId);
      } else if (gift.rezHoldId) {
        await rezWallet.releaseHold(gift.rezHoldId, receiverRezId);
      }
    } catch (err) {
      // C-5 FIX: REZ transfer failed — revert the ACCEPTED status so the gift can be retried,
      // log a structured audit entry, and re-throw so the HTTP layer returns a proper error
      // to the client instead of silently swallowing the failure.
      log.error({ giftId, err }, '[GiftService] acceptGift REZ call failed');

      // Compensating transaction: revert to PENDING so accept can be retried
      await prisma.gift.update({
        where: { id: giftId },
        data: { status: GiftStatus.PENDING, acceptedAt: null, messageUnlocked: false },
      }).catch((revertErr: unknown) => {
        log.error({ giftId, revertErr }, '[GiftService] CRITICAL: failed to revert gift after REZ error');
      });

      throw new AppError(502, 'Gift transfer failed. Please try again or contact support.');
    }

    await messaging.unlockFromGift(gift.matchId);

    return { success: true, voucherId: updated.rezVoucherId };
  }

  async rejectGift(receiverId: string, giftId: string): Promise<void> {
    // Atomic status update first — eliminates TOCTOU race where two concurrent
    // rejection requests both pass findFirst(PENDING) and both trigger refundHold,
    // causing a double-refund on the REZ wallet hold.
    const atomicUpdate = await prisma.gift.updateMany({
      where: { id: giftId, receiverId, status: GiftStatus.PENDING },
      data: { status: GiftStatus.REJECTED, rejectedAt: new Date() },
    });
    if (atomicUpdate.count === 0) throw new AppError(404, 'Gift not found or already actioned');

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new AppError(404, 'Gift not found');

    if (gift.rezHoldId) await rezWallet.refundHold(gift.rezHoldId, 'gift_rejected');

    await messaging.revertToLocked(gift.matchId);
    await fraud.checkRejectionPattern(gift.senderId, gift.receiverId);
  }

  async getVoucher(profileId: string, giftId: string): Promise<object> {
    const gift = await prisma.gift.findFirst({
      where: { id: giftId, receiverId: profileId, status: GiftStatus.ACCEPTED },
    });
    if (!gift || !gift.rezVoucherId) throw new AppError(404, 'Voucher not found');
    return rezGift.getVoucher(gift.rezVoucherId);
  }

  private async getGiftAttemptNumber(senderId: string, receiverId: string): Promise<number> {
    const count = await prisma.gift.count({ where: { senderId, receiverId } });
    return count + 1;
  }

  private adjustAmountForAttempt(basePaise: number, attempt: number): number {
    if (attempt >= 4) throw new AppError(403, 'Gift limit reached for this match');
    if (attempt === 3) return basePaise * 2;
    if (attempt === 2) return Math.floor(basePaise * 1.5);
    return basePaise;
  }
}
