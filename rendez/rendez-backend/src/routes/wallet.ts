import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { getBalance } from '../integrations/rez/rezWalletClient';
import { auditPartnerCall } from '../middleware/partnerAudit';

const router = Router();

// RZ-B-C3 FIX: Validate query enum params before use. The `as any` bypasses TypeScript
// and could pass invalid values to Prisma or downstream logic.
const GIFT_STATUS_VALUES = ['PENDING', 'ACCEPTED', 'REJECTED', 'REDEEMED', 'EXPIRED'] as const;
const GIFT_TYPE_VALUES = ['COIN', 'MERCHANT_VOUCHER'] as const;

function toEnum<T extends string>(val: string | undefined, allowed: readonly string[]): T | undefined {
  if (!val) return undefined;
  return allowed.includes(val) ? (val as T) : undefined;
}

// GET /api/v1/wallet/balance — proxy to REZ
router.get('/balance', rendezAuth, auditPartnerCall('wallet:balance'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: req.user!.id },
      select: { rezUserId: true },
    });
    if (!profile) throw new AppError(404, 'Profile not found');
    if (!profile.rezUserId) throw new AppError(422, 'REZ account not linked — cannot fetch balance');

    const balance = await getBalance(profile.rezUserId);
    res.json(balance);
  } catch (err) { next(err); }
});

// GET /api/v1/wallet/gifts — received gifts
router.get('/gifts', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // RZ-B-C3 FIX: Validate enum params explicitly instead of casting to `any`.
    // Invalid values are silently dropped (returning all gifts) rather than crashing.
    const status = toEnum<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REDEEMED' | 'EXPIRED'>(
      req.query.status as string,
      GIFT_STATUS_VALUES,
    );
    const giftType = toEnum<'COIN' | 'MERCHANT_VOUCHER'>(
      req.query.type as string,
      GIFT_TYPE_VALUES,
    );

    const gifts = await prisma.gift.findMany({
      where: {
        receiverId: req.user!.id,
        ...(status && { status }),
        ...(giftType && { giftType }),
      },
      include: {
        sender: { select: { name: true, photos: true } },
        match: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(gifts);
  } catch (err) { next(err); }
});

// GET /api/v1/wallet/gifts/sent — gifts I sent
router.get('/gifts/sent', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const gifts = await prisma.gift.findMany({
      where: { senderId: req.user!.id },
      include: {
        receiver: { select: { name: true, photos: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(gifts);
  } catch (err) { next(err); }
});

export default router;
