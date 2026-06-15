/**
 * Life Story API routes
 * @module routes/lifeStory
 */
import { Router } from 'express';
import { z } from 'zod';
import { lifeStoryService } from '../services/lifeStoryService.js';
import { asyncHandler, NotFoundError } from '../middleware/errorHandler.js';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
const router = Router();
/**
 * Validation schemas
 */
const generateStorySchema = z.object({
    userId: z.string().min(1, 'userId is required'),
    timeRange: z.object({
        start: z.string(),
        end: z.string(),
    }).optional(),
    focus: z.array(z.string()).optional(),
    themes: z.array(z.string()).optional(),
    tone: z.string().optional(),
});
const addChapterSchema = z.object({
    userId: z.string().min(1, 'userId is required'),
    chapterTitle: z.string().min(1, 'chapterTitle is required'),
    events: z.array(z.string()).default([]),
    emotions: z.array(z.string()).default([]),
    themes: z.array(z.string()).default([]),
});
const updateChapterSchema = z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    events: z.array(z.string()).optional(),
    emotions: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    keyMoments: z.array(z.string()).optional(),
    themes: z.array(z.string()).optional(),
});
const userIdParamsSchema = z.object({
    userId: z.string().min(1),
});
const storyChapterParamsSchema = z.object({
    storyId: z.string().min(1),
    chapterId: z.string().min(1),
});
/**
 * POST /api/story/generate
 * Generate a new life story for a user
 */
router.post('/generate', validateBody(generateStorySchema), asyncHandler(async (req, res) => {
    const options = req.body;
    const story = await lifeStoryService.generateStory(options.userId, options);
    res.status(201).json({
        success: true,
        data: story,
    });
}));
/**
 * GET /api/story/:userId
 * Get a user's life story
 */
router.get('/:userId', validateParams(userIdParamsSchema), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const story = await lifeStoryService.getStory(userId);
    if (!story) {
        throw new NotFoundError('Life story');
    }
    res.json({
        success: true,
        data: story,
    });
}));
/**
 * GET /api/story/:storyId/chapter/:chapterId
 * Get a specific chapter from a story
 */
router.get('/:storyId/chapter/:chapterId', validateParams(storyChapterParamsSchema), asyncHandler(async (req, res) => {
    const { storyId, chapterId } = req.params;
    const chapter = await lifeStoryService.getChapter(storyId, chapterId);
    if (!chapter) {
        throw new NotFoundError('Chapter');
    }
    res.json({
        success: true,
        data: chapter,
    });
}));
/**
 * POST /api/story/:userId/chapter
 * Add a new chapter to a user's story
 */
router.post('/:userId/chapter', validateParams(userIdParamsSchema), validateBody(addChapterSchema), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { chapterTitle, events, emotions, themes } = req.body;
    const story = await lifeStoryService.addChapter(userId, chapterTitle, events, emotions, themes);
    res.status(201).json({
        success: true,
        data: story,
    });
}));
/**
 * PUT /api/story/:storyId/chapter/:chapterId
 * Update an existing chapter
 */
router.put('/:storyId/chapter/:chapterId', validateParams(storyChapterParamsSchema), validateBody(updateChapterSchema), asyncHandler(async (req, res) => {
    const { storyId, chapterId } = req.params;
    const updates = req.body;
    const chapter = await lifeStoryService.updateChapter(storyId, chapterId, updates);
    if (!chapter) {
        throw new NotFoundError('Chapter');
    }
    res.json({
        success: true,
        data: chapter,
    });
}));
/**
 * DELETE /api/story/:storyId/chapter/:chapterId
 * Delete a chapter from a story
 */
router.delete('/:storyId/chapter/:chapterId', validateParams(storyChapterParamsSchema), asyncHandler(async (req, res) => {
    const { storyId, chapterId } = req.params;
    const deleted = await lifeStoryService.deleteChapter(storyId, chapterId);
    if (!deleted) {
        throw new NotFoundError('Chapter');
    }
    res.json({
        success: true,
        message: 'Chapter deleted successfully',
    });
}));
/**
 * GET /api/story/:userId/themes
 * Get all themes from a user's story
 */
router.get('/:userId/themes', validateParams(userIdParamsSchema), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const themes = await lifeStoryService.getThemes(userId);
    res.json({
        success: true,
        data: themes,
    });
}));
/**
 * GET /api/story/:storyId/arc
 * Get the story arc for a story
 */
router.get('/:storyId/arc', asyncHandler(async (req, res) => {
    const { storyId } = req.params;
    const arc = await lifeStoryService.getArc(storyId);
    if (arc === null) {
        throw new NotFoundError('Story arc');
    }
    res.json({
        success: true,
        data: { arc },
    });
}));
/**
 * GET /api/story/:userId/summary
 * Get a summary of a user's life story
 */
router.get('/:userId/summary', validateParams(userIdParamsSchema), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const maxChapters = req.query.maxChapters
        ? parseInt(req.query.maxChapters, 10)
        : undefined;
    const summary = await lifeStoryService.summarizeLife(userId, maxChapters);
    res.json({
        success: true,
        data: summary,
    });
}));
export default router;
//# sourceMappingURL=lifeStory.js.map