import { Router, Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Register push token
router.post(
  '/tokens',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, token, platform, deviceId } = req.body;
    if (!userId || !token || !platform) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId, token, and platform are required' } });
    }
    const result = await notificationService.registerToken(userId, token, platform, deviceId);
    return res.json({ success: true, data: result });
  })
);

// Send notification
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, title, body, data, type } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId, title, and body are required' } });
    }
    const result = await notificationService.sendToUser({ userId, title, body, data, type });
    return res.json({ success: true, data: result });
  })
);

// Send bulk notifications
router.post(
  '/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const { userIds, title, body, data, type } = req.body;
    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userIds array, title, and body are required' } });
    }
    const result = await notificationService.sendBulk(userIds, { title, body, data, type });
    return res.json({ success: true, data: result });
  })
);

// Get user notifications
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, page = '1', limit = '20' } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } });
    }
    const result = await notificationService.getUserNotifications(userId as string, parseInt(page as string, 10), parseInt(limit as string, 10));
    return res.json({ success: true, data: result });
  })
);

// Get unread count
router.get(
  '/unread/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const count = await notificationService.getUnreadCount(userId);
    return res.json({ success: true, data: { unreadCount: count } });
  })
);

// Mark as read
router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } });
    }
    await notificationService.markAsRead(id, userId);
    return res.json({ success: true, data: { read: true } });
  })
);

// Mark all as read
router.patch(
  '/read-all/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await notificationService.markAllAsRead(userId);
    return res.json({ success: true, data: { read: true } });
  })
);

export default router;