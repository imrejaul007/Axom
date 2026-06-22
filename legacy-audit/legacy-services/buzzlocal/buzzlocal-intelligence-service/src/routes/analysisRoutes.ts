import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiAnalysisService } from '../services/aiAnalysisService.js';
import { ContentAnalysis } from '../models/contentAnalysis.js';
import { AnalyzeContentSchema, BatchAnalyzeSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { redisClient } from '../utils/redis.js';

const router = Router();

// Middleware for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Analyze single content
router.post(
  '/analyze',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = AnalyzeContentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.issues,
        },
      });
    }

    const { contentId, userId, text, context } = validation.data;

    // Check cache first
    const cacheKey = `analysis:${contentId}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      logger.debug('Returning cached analysis', { contentId });
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Perform analysis
    const result = await aiAnalysisService.analyzeContent(contentId, userId, text, context);

    // Save to database
    const analysis = new ContentAnalysis({
      contentId,
      userId,
      text,
      context: context || 'post',
      moderation: result.moderation,
      sentiment: result.sentiment,
      spam: result.spam,
      toxicity: result.toxicity,
      flagged: result.flagged,
    });

    await analysis.save();

    // Cache result for 1 hour
    await redisClient.set(cacheKey, JSON.stringify(result), 3600);

    logger.info('Content analysis completed', { contentId, flagged: result.flagged });

    return res.json({
      success: true,
      data: result,
      cached: false,
    });
  })
);

// Batch analyze multiple content items
router.post(
  '/analyze/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = BatchAnalyzeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.issues,
        },
      });
    }

    const { items } = validation.data;

    const results = await aiAnalysisService.batchAnalyze(
      items.map(item => ({
        contentId: item.contentId || uuidv4(),
        userId: item.userId,
        text: item.text,
        context: item.context,
      }))
    );

    // Save all results to database
    const analyses = results.map((result, index) =>
      new ContentAnalysis({
        contentId: items[index].contentId || uuidv4(),
        userId: items[index].userId,
        text: items[index].text,
        context: items[index].context || 'post',
        moderation: result.moderation,
        sentiment: result.sentiment,
        spam: result.spam,
        toxicity: result.toxicity,
        flagged: result.flagged,
      })
    );

    await ContentAnalysis.insertMany(analyses);

    logger.info('Batch analysis completed', { count: items.length });

    return res.json({
      success: true,
      data: {
        results,
        total: results.length,
        flagged: results.filter(r => r.flagged).length,
      },
    });
  })
);

// Get analysis by content ID
router.get(
  '/analysis/:contentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;

    const analysis = await ContentAnalysis.findOne({ contentId }).sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Analysis not found for this content ID',
        },
      });
    }

    return res.json({
      success: true,
      data: analysis,
    });
  })
);

// Get analysis history for a user
router.get(
  '/analysis/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = '20', offset = '0', flagged } = req.query;

    const query: Record<string, unknown> = { userId };
    if (flagged !== undefined) {
      query.flagged = flagged === 'true';
    }

    const analyses = await ContentAnalysis.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string, 10))
      .limit(parseInt(limit as string, 10));

    const total = await ContentAnalysis.countDocuments(query);

    return res.json({
      success: true,
      data: {
        items: analyses,
        total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  })
);

// Get flagged content statistics
router.get(
  '/stats/flagged',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const matchStage: Record<string, unknown> = { flagged: true };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        (matchStage.createdAt as Record<string, Date>).$gte = new Date(startDate as string);
      }
      if (endDate) {
        (matchStage.createdAt as Record<string, Date>).$lte = new Date(endDate as string);
      }
    }

    const stats = await ContentAnalysis.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalFlagged: { $sum: 1 },
          byContext: { $push: '$context' },
          avgToxicityScore: { $avg: '$toxicity.score' },
          avgSpamScore: { $avg: '$spam.score' },
        },
      },
      {
        $project: {
          _id: 0,
          totalFlagged: 1,
          avgToxicityScore: { $round: ['$avgToxicityScore', 3] },
          avgSpamScore: { $round: ['$avgSpamScore', 3] },
        },
      },
    ]);

    return res.json({
      success: true,
      data: stats[0] || {
        totalFlagged: 0,
        avgToxicityScore: 0,
        avgSpamScore: 0,
      },
    });
  })
);

// Get sentiment distribution
router.get(
  '/stats/sentiment',
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '7d' } = req.query;

    let startDate = new Date();
    const days = parseInt(period as string, 10) || 7;
    startDate.setDate(startDate.getDate() - days);

    const distribution = await ContentAnalysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          label: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const percentages = distribution.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100 * 10) / 10 : 0,
    }));

    return res.json({
      success: true,
      data: {
        distribution: percentages,
        total,
        period,
      },
    });
  })
);

export default router;