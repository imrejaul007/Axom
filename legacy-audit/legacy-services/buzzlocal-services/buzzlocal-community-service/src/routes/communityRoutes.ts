import { Router, Response } from 'express';
import { communityService } from '../services/communityService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /communities
 * List communities
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, area, joined, page, limit } = req.query;

    const result = await communityService.listCommunities({
      type: type as unknown,
      area: area as string,
      userId: req.userId,
      joined: joined === 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (error) {
    console.error('List communities error:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

/**
 * GET /communities/suggested
 * Get suggested communities
 */
router.get('/suggested', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const communities = await communityService.getSuggestedCommunities(
      req.userId!,
      limit ? parseInt(limit as string) : 10
    );
    res.json({ communities });
  } catch (error) {
    console.error('Suggested communities error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * GET /communities/user
 * Get user's communities
 */
router.get('/user', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const communities = await communityService.getUserCommunities(req.userId!);
    res.json({ communities });
  } catch (error) {
    console.error('User communities error:', error);
    res.status(500).json({ error: 'Failed to fetch your communities' });
  }
});

/**
 * GET /communities/:id
 * Get single community
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const community = await communityService.getCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

/**
 * POST /communities
 * Create community
 */
router.post('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, description, location, isPrivate } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type required' });
    }

    const community = await communityService.createCommunity({
      name,
      type,
      description,
      creatorId: req.userId!,
      location,
      isPrivate,
    });

    res.status(201).json(community);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: error.message || 'Failed to create community' });
  }
});

/**
 * POST /communities/:id/join
 * Join community
 */
router.post('/:id/join', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await communityService.joinCommunity(req.params.id, req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ error: error.message || 'Failed to join community' });
  }
});

/**
 * POST /communities/:id/leave
 * Leave community
 */
router.post('/:id/leave', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await communityService.leaveCommunity(req.params.id, req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ error: error.message || 'Failed to leave community' });
  }
});

export default router;
