"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditIdempotencyKey = creditIdempotencyKey;
exports.holdWallet = holdWallet;
exports.releaseHold = releaseHold;
exports.refundHold = refundHold;
exports.getBalance = getBalance;
exports.refundBooking = refundBooking;
exports.creditCoins = creditCoins;
exports.creditMeetupBonus = creditMeetupBonus;
exports.issuePlanCredit = issuePlanCredit;
const rezClient_1 = require("./rezClient");
const errorHandler_1 = require("../../middleware/errorHandler");
const telemetry_1 = require("../../config/telemetry");
// ─── Idempotency key generation ─────────────────────────────────────────────────
/** Stable idempotency key for a coin credit operation.
 * Format: credit:{reason}:{rezUserId}:{coins}:{timestamp_bucket}
 * The 60-second bucket prevents double-credit on rapid retries while still
 * allowing genuine re-attempts after the window expires. */
function creditIdempotencyKey(params) {
    const bucket = Math.floor(Date.now() / 60000); // 60-second bucket
    const metaStr = JSON.stringify(params.meta ?? {});
    const hash = Buffer.from(`${params.rezUserId}:${params.coins}:${params.reason}:${bucket}:${metaStr}`)
        .toString('base64url');
    return `credit:${hash}`;
}
async function holdWallet(params) {
    try {
        const { data } = await rezClient_1.rezClient.post('/wallet/hold', params);
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, params }, '[RezWallet] holdWallet failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Wallet hold failed');
    }
}
async function releaseHold(holdId, recipientRezUserId) {
    try {
        await rezClient_1.rezClient.post('/wallet/release', { hold_id: holdId, recipient_rez_user_id: recipientRezUserId });
    }
    catch (err) {
        telemetry_1.log.error({ err, holdId }, '[RezWallet] releaseHold failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Wallet release failed');
    }
}
async function refundHold(holdId, reason) {
    try {
        await rezClient_1.rezClient.post('/wallet/refund', { hold_id: holdId, reason });
    }
    catch (err) {
        telemetry_1.log.error({ err, holdId }, '[RezWallet] refundHold failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Wallet refund failed');
    }
}
async function getBalance(rezUserId) {
    try {
        const { data } = await rezClient_1.rezClient.get(`/wallet/balance/${rezUserId}`);
        return data;
    }
    catch (err) {
        telemetry_1.log.error({ err, rezUserId }, '[RezWallet] getBalance failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Balance lookup failed');
    }
}
// Plan-specific: full refund of a booking (zero applicants case)
async function refundBooking(rezBookingRef, reason) {
    try {
        await rezClient_1.rezClient.post('/partner/v1/bookings/refund', { booking_ref: rezBookingRef, reason });
    }
    catch (err) {
        telemetry_1.log.error({ err, rezBookingRef }, '[RezWallet] refundBooking failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Booking refund failed');
    }
}
// General: credit REZ coins to any user (referral rewards, bonuses)
// BULLETPROOF: always pass an idempotency_key to prevent double-credit on retry.
async function creditCoins(params) {
    try {
        await rezClient_1.rezClient.post('/partner/v1/coins/credit', {
            rez_user_id: params.rezUserId,
            coins: params.coins,
            reason: params.reason,
            meta: params.meta ?? {},
            idempotency_key: params.idempotencyKey ?? creditIdempotencyKey(params),
        });
    }
    catch (err) {
        telemetry_1.log.error({ err, params }, '[RezWallet] creditCoins failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Coin credit failed');
    }
}
// Rendez P2 FIX: Women-first reward — credit both meetup participants a "showed up" bonus
// in REZ coins. Idempotent per bookingId via the calling worker.
async function creditMeetupBonus(bookingId, participants) {
    for (const p of participants) {
        await creditCoins({
            rezUserId: p.rezUserId,
            coins: p.coins,
            reason: 'meetup_attendance_bonus',
            meta: { bookingId, source: 'rendez_meetup' },
            idempotencyKey: `meetup_bonus:${bookingId}:${p.rezUserId}`,
        });
    }
}
// Plan-specific: issue locked credit (had applicants but plan cancelled/expired)
// Credit is locked to same merchant category, expires after ttlDays days
async function issuePlanCredit(organizerRezUserId, rezBookingRef, ttlDays) {
    try {
        await rezClient_1.rezClient.post('/partner/v1/bookings/credit', {
            rez_user_id: organizerRezUserId,
            booking_ref: rezBookingRef,
            ttl_days: ttlDays,
            locked: true,
            reason: 'plan_cancelled_with_applicants',
        });
    }
    catch (err) {
        telemetry_1.log.error({ err, organizerRezUserId, rezBookingRef }, '[RezWallet] issuePlanCredit failed');
        throw err instanceof errorHandler_1.AppError ? err : new errorHandler_1.AppError(502, 'Plan credit issue failed');
    }
}
