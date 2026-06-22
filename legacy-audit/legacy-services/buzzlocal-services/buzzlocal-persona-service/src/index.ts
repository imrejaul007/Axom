import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { router } from './routes/personaRoutes';
import { Persona } from './models/PersonaModels';
import { PERSONA_DEFINITIONS } from './config/PersonaConfig';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4025;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'buzzlocal-persona-service', version: '1.0.0' });
});

app.use('/api/personas', router);

// ===== PERSONA ENDPOINTS =====

// Get all persona definitions
app.get('/api/personas/definitions', (req, res) => {
  const definitions = Object.values(PERSONA_DEFINITIONS).map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    description: p.description,
    features: p.features,
    contextTriggers: p.contextTriggers,
  }));
  res.json({ success: true, personas: definitions });
});

// Get user persona
app.get('/api/personas/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const persona = await Persona.findOne({ userId });
    if (!persona) {
      // Return default persona
      return res.json({
        success: true,
        persona: {
          userId,
          primaryPersona: 'explorer',
          secondaryPersonas: [],
          status: 'developing',
          confidence: 0,
          traits: {},
          activityScore: 0,
          earnedBadges: [],
        },
        isNew: true,
      });
    }

    res.json({ success: true, persona });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Detect/Update persona based on behavior
app.post('/api/personas/detect', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { actions, context } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    // Score each persona based on actions
    const scores: Record<string, number> = {};

    for (const [personaId, def] of Object.entries(PERSONA_DEFINITIONS)) {
      let score = 0;

      // Keyword matching
      if (actions) {
        for (const action of actions) {
          for (const keyword of def.keywords) {
            if (action.toLowerCase().includes(keyword.toLowerCase())) {
              score += 1;
            }
          }
        }
      }

      // Context matching
      if (context) {
        if (def.contextTriggers.time?.includes(context.time)) score += 2;
        if (def.contextTriggers.location?.includes(context.location)) score += 2;
        if (def.contextTriggers.dayOfWeek?.includes(context.dayOfWeek)) score += 1;
      }

      scores[personaId] = score;
    }

    // Get top personas
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0]?.[0] || 'explorer';
    const secondary = sorted.slice(1, 4).map(([id]) => id as any);

    // Update or create persona
    let persona = await Persona.findOne({ userId });

    if (persona) {
      persona.primaryPersona = primary as any;
      persona.secondaryPersonas = secondary;
      persona.confidence = Math.min(1, scores[primary] / 50); // Normalize to 0-1
      persona.lastActive = new Date();
      await persona.save();
    } else {
      persona = new Persona({
        userId,
        primaryPersona: primary,
        secondaryPersonas: secondary,
        confidence: 0.1,
        lastActive: new Date(),
      });
      await persona.save();
    }

    res.json({
      success: true,
      persona,
      scores,
      recommendedFeatures: PERSONA_DEFINITIONS[primary as keyof typeof PERSONA_DEFINITIONS].features,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get contextual surface for user
app.get('/api/personas/contextual', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { time = 'afternoon', location = 'exploring', dayOfWeek = 'weekday' } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const persona = await Persona.findOne({ userId });
    const primaryPersona = persona?.primaryPersona || 'explorer';

    const { getContextualSurface } = await import('./config/PersonaConfig');
    const surface = getContextualSurface(primaryPersona as any, {
      time: time as string,
      location: location as string,
      dayOfWeek: dayOfWeek as string,
    });

    res.json({
      success: true,
      surface,
      primaryPersona,
      personaInfo: PERSONA_DEFINITIONS[primaryPersona as keyof typeof PERSONA_DEFINITIONS],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Streak endpoints
app.get('/api/personas/streaks', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { Streak } = await import('./models/PersonaModels');
    const streaks = await Streak.find({ userId });

    res.json({ success: true, streaks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Activity logging
app.post('/api/personas/activity', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { action, persona, context, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User ID required' });
    }

    const { ActivityLog } = await import('./models/PersonaModels');
    const log = new ActivityLog({
      userId,
      action,
      persona,
      context: {
        time: context?.time ? new Date(context.time) : new Date(),
        location: context?.location,
        mood: context?.mood,
      },
      metadata: metadata || {},
    });
    await log.save();

    res.json({ success: true, logId: log._id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-personas';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(
╔═══════════════════════════════════════════════════════════════╗
║          BuzzLocal Persona Service                       ║
║                                                           ║
║  Status: Running                                        ║
║  Port: ${PORT}                                               ║
║                                                           ║
║  Personas: 14 types                                     ║
║  • Food Scout, Nightlife Hunter, Fitness Enthusiast      ║
║  • Deal Hunter, Event Insider, Society Guardian         ║
║  • Startup Insider, Campus Leader, Safety First        ║
║  • Commuter, Home Body, Explorer                       ║
║  • Early Bird, Late Owl                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

start();

export { app };
