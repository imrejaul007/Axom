import { Router, Request, Response, NextFunction } from 'express';
import { EmotionService } from '../services/emotionService.js';
import { EmotionType, EmotionTypeValue, isEmotionType } from '../types.js';
import { emotionRecordSchema, trendQuerySchema } from '../schemas/emotion.js';

/**
 * @typedef {import('../types.js').EmotionalState} EmotionalState
 * @typedef {import('../types.js').EmotionTrend} EmotionTrend
 * @typedef {import('../types.js').MoodProfile} MoodProfile
 */

/**
 * @type {EmotionService}
 */
const emotionService = new EmotionService();

/**
 * Express router for emotional intelligence endpoints.
 */
export const emotionRouter = Router();

/**
 * @route POST /api/emotion/record
 * @desc Record a new emotional state for a user
 * @access Public
 */
emotionRouter.post(
  '/record',
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = emotionRecordSchema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      next(err);
    }
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, emotions, intensity, triggers, context, source } = req.body;

      /**
       * @type {EmotionalState}
       */
      const state = await emotionService.recordEmotion(
        userId,
        emotions,
        intensity,
        triggers,
        context,
        source
      );

      res.status(201).json({
        success: true,
        data: state,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/emotion/latest/:userId
 * @desc Get the latest emotional state for a user
 * @access Public
 */
emotionRouter.get('/latest/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    /**
     * @type {EmotionalState | null}
     */
    const state = await emotionService.getLatest(userId);

    if (!state) {
      res.status(404).json({
        success: false,
        message: 'No emotional states recorded for this user',
      });
      return;
    }

    res.json({
      success: true,
      data: state,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/emotion/history/:userId
 * @desc Get emotional state history for a user
 * @access Public
 */
emotionRouter.get('/history/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);

    /**
     * @type {EmotionalState[]}
     */
    const history = await emotionService.getHistory(userId, limit);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/emotion/:userId/:emotionType
 * @desc Get emotional states filtered by emotion type
 * @access Public
 */
emotionRouter.get('/:userId/:emotionType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, emotionType } = req.params;

    if (!isEmotionType(emotionType.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: `Invalid emotion type: ${emotionType}`,
        validTypes: Object.values(EmotionType),
      });
      return;
    }

    const normalizedType = emotionType.toUpperCase() as EmotionTypeValue;

    /**
     * @type {EmotionalState[]}
     */
    const states = await emotionService.getByEmotion(userId, normalizedType);

    res.json({
      success: true,
      data: states,
      count: states.length,
      emotionType: normalizedType,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/emotion/profile/:userId
 * @desc Get mood profile for a user
 * @access Public
 */
emotionRouter.get('/profile/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    /**
     * @type {MoodProfile}
     */
    const profile = await emotionService.getMoodProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/emotion/trend/:userId/:emotionType
 * @desc Get trend analysis for a specific emotion
 * @access Public
 */
emotionRouter.get('/trend/:userId/:emotionType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, emotionType } = req.params;

    if (!isEmotionType(emotionType.toUpperCase())) {
      res.status(400).json({
        success: false,
        message: `Invalid emotion type: ${emotionType}`,
        validTypes: Object.values(EmotionType),
      });
      return;
    }

    const normalizedType = emotionType.toUpperCase() as EmotionTypeValue;
    const queryResult = trendQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: queryResult.error.errors,
      });
      return;
    }

    const hours = queryResult.data.hours;

    /**
     * @type {EmotionTrend}
     */
    const trend = await emotionService.getTrend(userId, normalizedType, hours);

    res.json({
      success: true,
      data: trend,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/emotion/dominant/:userId
 * @desc Get the dominant emotion for a user
 * @access Public
 */
emotionRouter.get('/dominant/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    /**
     * @type {EmotionTypeValue | null}
     */
    const dominant = await emotionService.getDominantEmotion(userId);

    if (!dominant) {
      res.status(404).json({
        success: false,
        message: 'No emotional data available for this user',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId,
        dominantEmotion: dominant,
      },
    });
  } catch (err) {
    next(err);
  }
});
