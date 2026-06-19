import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { GiftService } from '../services/GiftService';
import { giftLimiter, giftPairLimiter } from '../middleware/rateLimiter';
import { GiftType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { auditPartnerCall } from '../middleware/partnerAudit';
import { z } from 'zod';

const router = Router();
const giftService = new GiftService();

function isValidId(id: string): boolean {
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const sendGiftSchema = z.object({
  receiverId: z.string().cuid('Invalid receiverId'),
  matchId: z.string().cuid('Invalid matchId'),
  giftType: z.nativeEnum(GiftType),
  amountPaise: z.number().int().positive().max(500_000, 'Amount too large'),
  rezCatalogItemId: z.string().optional(),
  message: z.string().max(200).optional(),
});

router.get('/catalog', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await giftService.getCatalog(req.query.city as string);
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/send', rendezAuth, giftLimiter, giftPairLimiter, auditPartnerCall('gift:send'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { receiverId, matchId, giftType, amountPaise, rezCatalogItemId, message } = sendGiftSchema.parse(req.body);

    const [senderProfile, receiverProfile] = await Promise.all([
      prisma.profile.findUnique({ where: { id: req.user!.id }, select: { rezUserId: true } }),
      prisma.profile.findUnique({ where: { id: receiverId }, select: { rezUserId: true } }),
    ]);

    if (!senderProfile || !receiverProfile) throw new AppError(404, 'Profile not found');

    // H-2 FIX: null-check rezUserId before proceeding — a profile may exist without
    // a linked REZ account if the account was created via an admin path.
    if (!senderProfile.rezUserId) throw new AppError(422, 'Sender REZ account not linked');
    if (!receiverProfile.rezUserId) throw new AppError(422, 'Receiver REZ account not linked');

    const gift = await giftService.sendGift({
      senderId: req.user!.id,
      receiverId,
      matchId,
      giftType: giftType as GiftType,
      amountPaise,
      rezCatalogItemId,
      message,
      senderRezId: senderProfile.rezUserId,
      receiverRezId: receiverProfile.rezUserId,
    });

    res.status(201).json(gift);
  } catch (err) { next(err); }
});

router.post('/:giftId/accept', rendezAuth, auditPartnerCall('gift:accept'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.giftId)) return res.status(400).json({ message: 'INVALID_ID' });
    const profile = await prisma.profile.findUnique({ where: { id: req.user!.id }, select: { rezUserId: true } });
    if (!profile) throw new AppError(404, 'Profile not found');
    // H-2 FIX: guard against missing rezUserId before passing to REZ wallet
    if (!profile.rezUserId) throw new AppError(422, 'REZ account not linked — cannot accept gift');
    const result = await giftService.acceptGift(req.user!.id, req.params.giftId, profile.rezUserId);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/:giftId/reject', rendezAuth, auditPartnerCall('gift:reject'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.giftId)) return res.status(400).json({ message: 'INVALID_ID' });
    await giftService.rejectGift(req.user!.id, req.params.giftId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:giftId/voucher', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.giftId)) return res.status(400).json({ message: 'INVALID_ID' });
    const voucher = await giftService.getVoucher(req.user!.id, req.params.giftId);
    res.json(voucher);
  } catch (err) { next(err); }
});

export default router;
