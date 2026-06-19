import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { ModerationService } from '../services/ModerationService';
import { ReportReason } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { reportLimiter, blockLimiter } from '../middleware/rateLimiter';

const router = Router();
const moderation = new ModerationService();

const VALID_REPORT_REASONS = Object.values(ReportReason);

function isValidId(id: string): boolean {
  // CUID: starts with 'c', alphanumeric, ~25 chars
  // UUID: 8-4-4-4-12 hex pattern
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

router.post('/users/:profileId/report', rendezAuth, reportLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.profileId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const { reason, detail } = req.body;
    if (!reason || !VALID_REPORT_REASONS.includes(reason)) {
      throw new AppError(400, `Invalid reason. Must be one of: ${VALID_REPORT_REASONS.join(', ')}`);
    }
    await moderation.reportUser(req.user!.id, req.params.profileId, reason as ReportReason, detail);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/users/:profileId/block', rendezAuth, blockLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.profileId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    await moderation.blockUser(req.user!.id, req.params.profileId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/blocks', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blocks = await moderation.getBlocks(req.user!.id);
    res.json(blocks);
  } catch (err) { next(err); }
});

router.delete('/blocks/:profileId', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.profileId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    await moderation.unblock(req.user!.id, req.params.profileId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
