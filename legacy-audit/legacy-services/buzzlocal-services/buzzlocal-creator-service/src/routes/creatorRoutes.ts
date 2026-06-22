import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { creatorService } from '../services/CreatorService';

const router = Router();

// Validation schemas
const profileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  locality: z.object({
    areaId: z.string().min(1),
    areaName: z.string().min(1),
  }),
  specialization: z.array(z.string()).optional(),
});

const contentSchema = z.object({
  userId: z.string().min(1),
  creatorId: z.string().min(1),
  type: z.enum(['post', 'review', 'recommendation', 'alert', 'deal']),
  title: z.string().min(1),
  content: z.string().min(1),
  media: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string(),
  })).optional(),
  locality: z.object({
    areaId: z.string().min(1),
    areaName: z.string().min(1),
  }),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'creator-service' });
});

// ===== PROFILES =====

// POST /api/creator/profile - Create/update profile
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await creatorService.upsertProfile(data);
    res.json({ success: true, profile });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/profile/:userId - Get profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await creatorService.getProfile(userId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/top/:areaId - Get top creators by area
router.get('/top/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const role = req.query.role as any;
    const limit = parseInt(req.query.limit as string) || 10;
    const creators = await creatorService.getTopCreators(areaId, { role, limit });
    res.json({ success: true, creators });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/category/:category - Get creators by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const creators = await creatorService.getCreatorsByCategory(category, limit);
    res.json({ success: true, creators });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SOCIAL =====

// POST /api/creator/follow - Follow a creator
router.post('/follow', async (req: Request, res: Response) => {
  try {
    const { followerId, creatorId } = req.body;
    const result = await creatorService.followCreator(followerId, creatorId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/unfollow - Unfollow a creator
router.post('/unfollow', async (req: Request, res: Response) => {
  try {
    const { followerId, creatorId } = req.body;
    const result = await creatorService.unfollowCreator(followerId, creatorId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CONTENT =====

// POST /api/creator/content - Create content
router.post('/content', async (req: Request, res: Response) => {
  try {
    const data = contentSchema.parse(req.body);
    const content = await creatorService.createContent(data);
    res.json({ success: true, id: content._id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/content/:contentId/stats - Update content stats
router.post('/content/:contentId/stats', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { action } = req.body;
    if (!['view', 'like', 'comment', 'share', 'save'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    const content = await creatorService.updateContentStats(contentId, action);
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/content - Get content
router.get('/content', async (req: Request, res: Response) => {
  try {
    const options = {
      areaId: req.query.areaId as string,
      category: req.query.category as string,
      type: req.query.type as string,
      creatorId: req.query.creatorId as string,
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0,
    };
    const content = await creatorService.getContent(options);
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/amplify - Amplify content
router.post('/amplify', async (req: Request, res: Response) => {
  try {
    const { contentId, boostAmount } = req.body;
    const content = await creatorService.amplifyContent(contentId, boostAmount);
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PROGRAMS =====

// GET /api/creator/programs/:userId - Get programs with eligibility
router.get('/programs/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const programs = await creatorService.getPrograms(userId);
    res.json({ success: true, programs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/join-program - Join a program
router.post('/join-program', async (req: Request, res: Response) => {
  try {
    const { userId, programType } = req.body;
    const result = await creatorService.joinProgram(userId, programType);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ===== EARNINGS =====

// GET /api/creator/earnings/:userId - Get earnings
router.get('/earnings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await creatorService.getEarnings(userId, { status, limit });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/withdraw - Request withdrawal
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    const result = await creatorService.requestWithdrawal(userId, amount);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ===== CROSS-ECOSYSTEM INTEGRATIONS =====

// POST /api/creator/register-qr - Register on Creator QR
router.post('/register-qr', async (req: Request, res: Response) => {
  try {
    const { userId, ...creatorData } = req.body;
    const result = await creatorService.registerOnCreatorQR(userId, creatorData);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/qr-dashboard/:userId - Get Creator QR dashboard
router.get('/qr-dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await creatorService.getCreatorQRDashboard(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/prive/:userId - Check REZ Prive eligibility
router.get('/prive/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await creatorService.checkPriveEligibility(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/sync-prive/:userId - Sync with REZ Prive
router.post('/sync-prive/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await creatorService.syncWithRezPrive(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/merchant-insights/:creatorId - Get merchant insights
router.get('/merchant-insights/:creatorId', async (req: Request, res: Response) => {
  try {
    const { creatorId } = req.params;
    const result = await creatorService.getMerchantInsights(creatorId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/creator/unified-dashboard/:userId - Get unified dashboard
router.get('/unified-dashboard/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await creatorService.getUnifiedDashboard(userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/creator/transfer-wallet - Transfer earnings to wallet
router.post('/transfer-wallet', async (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    const result = await creatorService.transferToWallet(userId, amount);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as creatorRoutes };
