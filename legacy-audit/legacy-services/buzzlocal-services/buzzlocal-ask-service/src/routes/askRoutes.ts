import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { AskQuery, AskAnswer, ConversationThread, IAskQuery, IAskAnswer, QueryCategory } from '../models/AskModels';
import { IntentRouter } from '../services/IntentRouter';
import { ResponseSynthesizer } from '../services/ResponseSynthesizer';
import { TrustRouter } from '../services/TrustRouter';
import { WalletIntegration } from '../services/WalletIntegration';

const router = Router();
const intentRouter = new IntentRouter();
const responseSynthesizer = new ResponseSynthesizer();
const trustRouter = new TrustRouter();
const walletIntegration = new WalletIntegration();

// Validation schemas
const querySchema = z.object({
  query: z.string().min(3).max(500),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    area: z.string().optional(),
    address: z.string().optional()
  }).optional(),
  conversationId: z.string().optional(),
  context: z.object({
    previousQuery: z.string().optional()
  }).optional()
});

const answerSchema = z.object({
  queryId: z.string(),
  content: z.string().min(10).max(1000),
  type: z.enum(['ai', 'expert', 'community', 'verified']).optional()
});

const helpfulSchema = z.object({
  queryId: z.string().optional(),
  answerId: z.string().optional()
});

const conversationContextSchema = z.object({
  conversationId: z.string()
});

// Initialize conversation
router.post('/conversation/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, location } = req.body;

    const conversationId = uuidv4();

    const thread = new ConversationThread({
      conversationId,
      userId,
      location,
      queries: [],
      lastActivity: new Date()
    });

    await thread.save();

    res.json({
      success: true,
      conversationId,
      createdAt: thread.createdAt
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation history
router.get('/conversation/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;

    const thread = await ConversationThread.findOne({ conversationId });

    if (!thread) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all queries with answers
    const queries = await AskQuery.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(20);

    const queriesWithAnswers = await Promise.all(
      queries.map(async (q) => {
        const answers = await AskAnswer.find({ queryId: q._id })
          .sort({ helpful: -1, createdAt: -1 })
          .limit(5);

        return {
          query: q,
          answers
        };
      })
    );

    res.json({
      success: true,
      conversation: thread,
      queries: queriesWithAnswers
    });
  } catch (error) {
    next(error);
  }
});

// Submit a query
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = querySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { query, location, conversationId: existingConversationId, context } = validation.data;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    // Get user trust level
    const trustProfile = await trustRouter.getUserTrustProfile(userId);

    // Classify intent
    const intent = await intentRouter.classifyIntent(query, location);

    // Create or get conversation
    let conversationId = existingConversationId;
    if (!conversationId) {
      const existingThread = await ConversationThread.findOne({ userId });
      if (existingThread) {
        conversationId = existingThread.conversationId;
      } else {
        conversationId = uuidv4();
        const thread = new ConversationThread({
          conversationId,
          userId,
          location,
          queries: [],
          lastActivity: new Date()
        });
        await thread.save();
      }
    }

    // Create query
    const askQuery = new AskQuery({
      userId,
      userTrustLevel: trustProfile?.level || 'new',
      query,
      category: intent.category,
      intentType: intent.intentType,
      location,
      context,
      status: 'processing',
      conversationId,
      helpful: 0,
      notHelpful: 0
    });

    await askQuery.save();

    // Update conversation thread
    await ConversationThread.findOneAndUpdate(
      { conversationId },
      {
        $push: { queries: { queryId: askQuery._id.toString(), query, category: intent.category, createdAt: new Date() } },
        $set: { lastActivity: new Date(), currentQueryId: askQuery._id.toString() }
      }
    );

    // Get AI response
    const aiResponse = await intentRouter.getAIResponse(query, intent, location, trustProfile);

    // Get expert answers if relevant
    const expertAnswers = await intentRouter.getExpertAnswers(intent, location);

    // Get community answers
    const communityAnswers = await AskAnswer.find({
      category: intent.category,
      status: { $in: ['helpful', 'verified'] },
      helpful: { $gte: 2 }
    })
      .sort({ helpful: -1 })
      .limit(3);

    // Synthesize response
    const response = await responseSynthesizer.synthesize(
      query,
      intent,
      aiResponse,
      expertAnswers,
      communityAnswers
    );

    // Save AI answer
    const aiAnswer = new AskAnswer({
      queryId: askQuery._id,
      conversationId,
      userId: 'system',
      userTrustLevel: 'ai',
      userTrustScore: 0,
      content: response.answer,
      type: 'ai',
      status: 'pending',
      helpful: 0,
      notHelpful: 0,
      isFeatured: true
    });

    await aiAnswer.save();

    // Update query with response
    askQuery.status = 'answered';
    askQuery.response = {
      answer: response.answer,
      sources: response.sources,
      suggestedFollowUps: response.suggestedFollowUps
    };

    await askQuery.save();

    res.json({
      success: true,
      queryId: askQuery._id,
      conversationId,
      response: {
        answer: response.answer,
        sources: response.sources,
        suggestedFollowUps: response.suggestedFollowUps,
        aiAnswerId: aiAnswer._id
      },
      category: intent.category
    });
  } catch (error) {
    next(error);
  }
});

// Submit an answer to a query
router.post('/answer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = answerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { queryId, content, type = 'community' } = validation.data;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    // Get query
    const query = await AskQuery.findById(queryId);
    if (!query) {
      return res.status(404).json({ error: 'Query not found' });
    }

    // Get user trust profile
    const trustProfile = await trustRouter.getUserTrustProfile(userId);

    // Create answer
    const answer = new AskAnswer({
      queryId,
      conversationId: query.conversationId,
      userId,
      userTrustLevel: trustProfile?.level || 'new',
      userTrustScore: trustProfile?.score || 0,
      userArea: trustProfile?.area,
      content,
      type,
      status: 'pending',
      helpful: 0,
      notHelpful: 0,
      helpfulByUsers: [],
      notHelpfulByUsers: []
    });

    await answer.save();

    // Award coins for answering
    await walletIntegration.creditCoins(userId, 15, 'answer_submitted', {
      queryId,
      conversationId: query.conversationId
    });

    res.json({
      success: true,
      answerId: answer._id,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Mark answer as helpful
router.post('/mark-helpful', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { answerId } = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    const answer = await AskAnswer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Check if already marked
    if (answer.helpfulByUsers.includes(userId)) {
      return res.status(400).json({ error: 'Already marked as helpful' });
    }

    // Remove from not helpful if present
    if (answer.notHelpfulByUsers.includes(userId)) {
      answer.notHelpfulByUsers = answer.notHelpfulByUsers.filter(id => id !== userId);
      answer.notHelpful = Math.max(0, answer.notHelpful - 1);
    }

    // Add to helpful
    answer.helpfulByUsers.push(userId);
    answer.helpful += 1;

    // Update status based on helpful count
    if (answer.helpful >= 5 && answer.status !== 'verified') {
      answer.status = 'helpful';
    }

    await answer.save();

    // Award coins to answer author
    if (answer.helpful >= 5) {
      await walletIntegration.creditCoins(answer.userId, 25, 'answer_marked_helpful', {
        answerId,
        helpfulCount: answer.helpful
      });
    }

    res.json({
      success: true,
      helpful: answer.helpful,
      status: answer.status
    });
  } catch (error) {
    next(error);
  }
});

// Get answers for a query
router.get('/query/:queryId/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queryId } = req.params;
    const { sort = 'helpful', limit = 10, offset = 0 } = req.query;

    const answers = await AskAnswer.find({ queryId })
      .sort({ isFeatured: -1, [sort]: -1, createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AskAnswer.countDocuments({ queryId });

    res.json({
      success: true,
      answers,
      total,
      offset,
      limit
    });
  } catch (error) {
    next(error);
  }
});

// Get query history for user
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const { limit = 20, offset = 0 } = req.query;

    const queries = await AskQuery.find({ userId })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AskQuery.countDocuments({ userId });

    res.json({
      success: true,
      queries,
      total,
      offset,
      limit
    });
  } catch (error) {
    next(error);
  }
});

// Follow up query
router.post('/followup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queryId, followUpQuery } = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    const originalQuery = await AskQuery.findById(queryId);
    if (!originalQuery) {
      return res.status(404).json({ error: 'Original query not found' });
    }

    // Create follow-up query with context
    const intent = await intentRouter.classifyIntent(followUpQuery, originalQuery.location);

    const followUp = new AskQuery({
      userId,
      userTrustLevel: originalQuery.userTrustLevel,
      query: followUpQuery,
      category: intent.category,
      intentType: intent.intentType,
      location: originalQuery.location,
      context: {
        conversationId: originalQuery.conversationId,
        previousQuery: originalQuery.query
      },
      status: 'processing',
      conversationId: originalQuery.conversationId,
      helpful: 0,
      notHelpful: 0
    });

    await followUp.save();

    // Get context-aware response
    const aiResponse = await intentRouter.getAIResponse(
      followUpQuery,
      intent,
      originalQuery.location,
      null,
      originalQuery.query
    );

    const response = await responseSynthesizer.synthesize(
      followUpQuery,
      intent,
      aiResponse,
      [],
      [],
      originalQuery.query
    );

    // Save AI answer
    const aiAnswer = new AskAnswer({
      queryId: followUp._id,
      conversationId: followUp.conversationId,
      userId: 'system',
      userTrustLevel: 'ai',
      userTrustScore: 0,
      content: response.answer,
      type: 'ai',
      status: 'pending',
      isFeatured: true
    });

    await aiAnswer.save();

    followUp.status = 'answered';
    followUp.response = {
      answer: response.answer,
      sources: response.sources,
      suggestedFollowUps: response.suggestedFollowUps
    };

    await followUp.save();

    res.json({
      success: true,
      queryId: followUp._id,
      conversationId: followUp.conversationId,
      response: {
        answer: response.answer,
        sources: response.sources,
        suggestedFollowUps: response.suggestedFollowUps
      },
      contextQuery: originalQuery.query
    });
  } catch (error) {
    next(error);
  }
});

// Search similar questions
router.get('/similar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, category, limit = 5 } = req.query;

    const queries = await AskQuery.find({
      query: { $regex: q as string, $options: 'i' },
      ...(category && { category })
    })
      .sort({ helpful: -1, createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      queries
    });
  } catch (error) {
    next(error);
  }
});

// Get trending queries
router.get('/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, limit = 10 } = req.query;

    const queries = await AskQuery.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          avgHelpful: { $avg: '$helpful' },
          category: { $first: '$category' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({
      success: true,
      trending: queries
    });
  } catch (error) {
    next(error);
  }
});

export { router as askRoutes };
