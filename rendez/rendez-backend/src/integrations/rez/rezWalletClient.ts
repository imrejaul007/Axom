import { rezClient as client } from './rezClient';
import { AppError } from '../../middleware/errorHandler';
import { log } from '../../config/telemetry';


export interface HoldResult {
  hold_id: string;
  balance_after: number;
}

export interface WalletBalance {
  balance_paise: number;
  coin_balance: number;
}

// ─── Idempotency key generation ─────────────────────────────────────────────────

/** Stable idempotency key for a coin credit operation.
 * Format: credit:{reason}:{rezUserId}:{coins}:{timestamp_bucket}
 * The 60-second bucket prevents double-credit on rapid retries while still
 * allowing genuine re-attempts after the window expires. */
export function creditIdempotencyKey(params: {
  reason: string;
  rezUserId: string;
  coins: number;
  meta?: Record<string, unknown>;
}): string {
  const bucket = Math.floor(Date.now() / 60_000); // 60-second bucket
  const metaStr = JSON.stringify(params.meta ?? {});
  const hash = Buffer.from(`${params.rezUserId}:${params.coins}:${params.reason}:${bucket}:${metaStr}`)
    .toString('base64url');
  return `credit:${hash}`;
}

export async function holdWallet(params: {
  rez_user_id: string;
  amount_paise: number;
  idempotency_key: string;
  reason: string;
}): Promise<HoldResult> {
  try {
    const { data } = await client.post('/wallet/hold', params);
    return data;
  } catch (err) {
    log.error({ err, params }, '[RezWallet] holdWallet failed');
    throw err instanceof AppError ? err : new AppError(502, 'Wallet hold failed');
  }
}

export async function releaseHold(holdId: string, recipientRezUserId: string): Promise<void> {
  try {
    await client.post('/wallet/release', { hold_id: holdId, recipient_rez_user_id: recipientRezUserId });
  } catch (err) {
    log.error({ err, holdId }, '[RezWallet] releaseHold failed');
    throw err instanceof AppError ? err : new AppError(502, 'Wallet release failed');
  }
}

export async function refundHold(holdId: string, reason: string): Promise<void> {
  try {
    await client.post('/wallet/refund', { hold_id: holdId, reason });
  } catch (err) {
    log.error({ err, holdId }, '[RezWallet] refundHold failed');
    throw err instanceof AppError ? err : new AppError(502, 'Wallet refund failed');
  }
}

export async function getBalance(rezUserId: string): Promise<WalletBalance> {
  try {
    const { data } = await client.get(`/wallet/balance/${rezUserId}`);
    return data;
  } catch (err) {
    log.error({ err, rezUserId }, '[RezWallet] getBalance failed');
    throw err instanceof AppError ? err : new AppError(502, 'Balance lookup failed');
  }
}

// Plan-specific: full refund of a booking (zero applicants case)
export async function refundBooking(rezBookingRef: string, reason: string): Promise<void> {
  try {
    await client.post('/partner/v1/bookings/refund', { booking_ref: rezBookingRef, reason });
  } catch (err) {
    log.error({ err, rezBookingRef }, '[RezWallet] refundBooking failed');
    throw err instanceof AppError ? err : new AppError(502, 'Booking refund failed');
  }
}

// General: credit REZ coins to any user (referral rewards, bonuses)
// BULLETPROOF: always pass an idempotency_key to prevent double-credit on retry.
export async function creditCoins(params: {
  rezUserId: string;
  coins: number;
  reason: string;
  meta?: Record<string, unknown>;
  idempotencyKey?: string;
}): Promise<void> {
  try {
    await client.post('/partner/v1/coins/credit', {
      rez_user_id:      params.rezUserId,
      coins:            params.coins,
      reason:           params.reason,
      meta:             params.meta ?? {},
      idempotency_key:  params.idempotencyKey ?? creditIdempotencyKey(params),
    });
  } catch (err) {
    log.error({ err, params }, '[RezWallet] creditCoins failed');
    throw err instanceof AppError ? err : new AppError(502, 'Coin credit failed');
  }
}

// Rendez P2 FIX: Women-first reward — credit both meetup participants a "showed up" bonus
// in REZ coins. Idempotent per bookingId via the calling worker.
export async function creditMeetupBonus(bookingId: string, participants: Array<{ rezUserId: string; coins: number }>): Promise<void> {
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
export async function issuePlanCredit(organizerRezUserId: string, rezBookingRef: string, ttlDays: number): Promise<void> {
  try {
    await client.post('/partner/v1/bookings/credit', {
      rez_user_id:  organizerRezUserId,
      booking_ref:  rezBookingRef,
      ttl_days:     ttlDays,
      locked:       true,
      reason:       'plan_cancelled_with_applicants',
    });
  } catch (err) {
    log.error({ err, organizerRezUserId, rezBookingRef }, '[RezWallet] issuePlanCredit failed');
    throw err instanceof AppError ? err : new AppError(502, 'Plan credit issue failed');
  }
}
