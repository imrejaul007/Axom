import { Router, Request, Response, NextFunction } from 'express';
import { Persona } from '../models/PersonaModels';

export const router = Router();

// Get persona leaderboard
router.get('/leaderboard/:personaType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personaType } = req.params;
    const { limit = 10 } = req.query;

    const leaders = await Persona.find({ primaryPersona: personaType, status: 'active' })
      .sort({ activityScore: -1 })
      .limit(Number(limit))
      .select('userId activityScore earnedBadges');

    res.json({ success: true, leaderboard: leaders });
  } catch (error) {
    next(error);
  }
});

// Get persona distribution stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await Persona.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$primaryPersona',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgActivity: { $avg: '$activityScore' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
});

// Update persona traits
router.put('/traits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { traits } = req.body;

    const persona = await Persona.findOne({ userId });
    if (!persona) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    persona.traits = { ...persona.traits, ...traits };
    await persona.save();

    res.json({ success: true, persona });
  } catch (error) {
    next(error);
  }
});

// Claim persona
router.post('/claim/:personaType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { personaType } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    let persona = await Persona.findOne({ userId });

    if (persona) {
      persona.primaryPersona = personaType as any;
      persona.status = 'active';
      persona.confidence = 0.5; // Manual claim has 50% confidence
      persona.secondaryPersonas = persona.secondaryPersonas.filter(p => p !== personaType);
      await persona.save();
    } else {
      persona = new Persona({
        userId,
        primaryPersona: personaType,
        secondaryPersonas: [],
        status: 'active',
        confidence: 0.5,
      });
      await persona.save();
    }

    res.json({ success: true, persona });
  } catch (error) {
    next(error);
  }
});

// Get trending personas in area
router.get('/trending/:area', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area } = req.params;

    // For now, return global stats
    // In production, filter by area
    const stats = await Persona.aggregate([
      { $match: { status: 'active' } },
      { $sortByCount: '$primaryPersona' },
      { $limit: 5 },
    ]);

    res.json({ success: true, trending: stats });
  } catch (error) {
    next(error);
  }
});
