import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { MatchService } from '../services/MatchService';
import { likeLimiter } from '../middleware/rateLimiter';
import { captureMatchReceived } from '../services/intentCapture.service';
import { logger } from '../config/logger';

const router = Router();
const matchService = new MatchService();

function isValidId(id: string): boolean {
  // CUID: starts with 'c', alphanumeric, ~25 chars
  // UUID: 8-4-4-4-12 hex pattern
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

router.post('/likes/:profileId', rendezAuth, likeLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.profileId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const result = await matchService.sendLike(req.user!.id, req.params.profileId);

    // RTMN Commerce Memory: Capture match received intent (non-blocking)
    if (result.matched && result.matchId) {
      captureMatchReceived({
        userId: req.user!.id,
        matchId: result.matchId,
        matchedUserId: req.params.profileId,
        intent: 'DATING',
      }).catch((err) => logger.warn('[IntentCapture] Failed to capture match received', { error: err, matchId: result.matchId }));
    }

    res.json(result);
  } catch (err) { next(err); }
});

router.get('/', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const matches = await matchService.getMatches(req.user!.id);
    res.json(matches);
  } catch (err) { next(err); }
});

router.delete('/:matchId', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.matchId)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    await matchService.unmatch(req.user!.id, req.params.matchId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
