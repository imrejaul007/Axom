import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { MessagingService } from '../services/MessagingService';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import rateLimit from 'express-rate-limit';
import { captureMessageSent } from '../services/intentCapture.service';

// 60 messages per user per minute — prevents flooding outside the state machine
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as AuthRequest).user?.id || req.ip || 'anon',
  message: { message: 'MESSAGE_RATE_LIMIT', details: 'Slow down — maximum 60 messages per minute' },
});

const router = Router();
const messaging = new MessagingService();

function isValidId(id: string): boolean {
  // CUID: starts with 'c', alphanumeric, ~25 chars
  // UUID: 8-4-4-4-12 hex pattern
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

router.get('/:matchId/messages', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const result = await messaging.getMessages(req.user!.id, req.params.matchId, req.query.cursor as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/:matchId/messages', rendezAuth, messageLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const { content } = req.body;
    if (!content?.trim()) throw new AppError(400, 'Message content required');
    const message = await messaging.sendMessage(req.user!.id, req.params.matchId, content.trim());

    // RTMN Commerce Memory: Capture message sent intent (non-blocking)
    captureMessageSent({
      userId: req.user!.id,
      matchId: req.params.matchId,
      messageId: message.id,
      content: content.trim(),
    }).catch((err) => logger.warn('[IntentCapture] Failed to capture message sent', { error: err, messageId }));

    res.status(201).json(message);
  } catch (err) { next(err); }
});

router.get('/:matchId/state', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const match = await prisma.match.findFirst({
      where: { id: req.params.matchId, OR: [{ user1Id: req.user!.id }, { user2Id: req.user!.id }] },
      include: { messageState: true },
    });
    if (!match) throw new AppError(404, 'Match not found');
    res.json({ state: match.messageState?.state, giftUnlockCount: match.messageState?.giftUnlockCount });
  } catch (err) { next(err); }
});

export default router;
