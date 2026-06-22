import { Router, Response } from 'express';
import { notificationService } from '../services/notificationService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * POST /notifications/register
 * Register push token
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Use userId if available, otherwise use device ID
    const userId = req.userId || deviceId || 'anonymous';

    const result = await notificationService.registerToken(
      userId,
      token,
      platform || 'expo',
      deviceId
    );

    res.json(result);
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ error: 'Failed to register token' });
  }
});

/**
 * GET /notifications
 * Get user's notifications
 */
router.get('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = await notificationService.getUserNotifications(
      req.userId!,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /notifications/count
 * Get unread count
 */
router.get('/count', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

/**
 * POST /notifications/read/:id
 * Mark notification as read
 */
router.post('/read/:id', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAsRead(req.params.id, req.userId!);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * POST /notifications/read-all
 * Mark all as read
 */
router.post('/read-all', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.userId!);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * POST /notifications/send
 * Send notification (internal use)
 */
router.post('/send', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, title, body, data, type } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, and body required' });
    }

    const result = await notificationService.sendToUser({
      userId,
      title,
      body,
      data,
      type,
    });

    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

/**
 * POST /notifications/broadcast
 * Broadcast to multiple users
 */
router.post('/broadcast', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, title, body, data, type } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ error: 'userIds array, title, and body required' });
    }

    const result = await notificationService.sendBulk(userIds, {
      title,
      body,
      data,
      type,
    });

    res.json(result);
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast' });
  }
});

export default router;
