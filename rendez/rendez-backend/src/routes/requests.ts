/**
 * Chat request routes (Sprint 12 — Female Safety Controls)
 *
 * GET  /requests              — receiver's inbox of pending requests
 * POST /requests/:id/accept   — accept a pending request → opens chat
 * POST /requests/:id/decline  — decline a pending request
 */

import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { MessageRequestService } from '../services/MessageRequestService';

const router = Router();
const service = new MessageRequestService();

// Inbox — pending requests for the logged-in user
// RZ-B-M5 FIX: Added cursor-based pagination via cursor query param.
// RD-L-01 FIX: Validate cursor format (CUID or alphanumeric) to prevent injection.
router.get('/', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cursor, limit } = req.query;
    // RD-L-01 FIX: Validate cursor is alphanumeric + hyphen/underscore only, max 50 chars
    const safeCursor = typeof cursor === 'string' && /^[a-zA-Z0-9_-]{1,50}$/.test(cursor)
      ? cursor
      : undefined;
    const take = typeof limit === 'string' ? Math.min(parseInt(limit, 10) || 20, 50) : 20;
    const result = await service.getInbox(req.user!.id, safeCursor, take);
    res.json(result);
  } catch (err) { next(err); }
});

// Accept a request
router.post('/:requestId/accept', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.acceptRequest(req.user!.id, req.params.requestId);
    res.json({ ok: true, message: 'Request accepted — chat is now open' });
  } catch (err) { next(err); }
});

// Decline a request
router.post('/:requestId/decline', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.declineRequest(req.user!.id, req.params.requestId);
    res.json({ ok: true, message: 'Request declined' });
  } catch (err) { next(err); }
});

export default router;
