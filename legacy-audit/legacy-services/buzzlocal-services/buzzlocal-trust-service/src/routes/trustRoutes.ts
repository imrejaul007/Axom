import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  TrustProfile,
  VerificationRequest,
  TrustEvent,
  Neighborhood,
  BADGE_DEFINITIONS,
  LEVEL_THRESHOLDS,
  SCORE_WEIGHTS,
  TrustLevel,
  VerificationType
} from '../models/TrustModels';

const router = Router();

// Validation schemas
const verificationSchema = z.object({
  type: z.enum(['phone', 'email', 'address', 'society', 'id', 'merchant']),
  data: z.record(z.unknown()).optional(),
  documents: z.array(z.string()).optional()
});

const scoreUpdateSchema = z.object({
  type: z.string(),
  action: z.enum(['credit', 'debit']),
  points: z.number(),
  reason: z.string(),
  metadata: z.record(z.unknown()).optional()
});

const neighborhoodSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['area', 'apartment', 'layout', 'campus', 'society']),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    city: z.string().optional(),
    pincode: z.string().optional()
  }),
  parentNeighborhood: z.string().optional()
});

// Helper: Get or create trust profile
async function getOrCreateProfile(userId: string) {
  let profile = await TrustProfile.findOne({ userId });
  if (!profile) {
    profile = new TrustProfile({ userId });
    await profile.save();
  }
  return profile;
}

// Helper: Calculate level from score
function calculateLevel(score: number): TrustLevel {
  if (score >= LEVEL_THRESHOLDS.legend) return 'legend';
  if (score >= LEVEL_THRESHOLDS.guardian) return 'guardian';
  if (score >= LEVEL_THRESHOLDS.expert) return 'expert';
  if (score >= LEVEL_THRESHOLDS.trusted) return 'trusted';
  if (score >= LEVEL_THRESHOLDS.verified) return 'verified';
  return 'new';
}

// Helper: Award badge
async function checkAndAwardBadges(profile: InstanceType<typeof TrustProfile>) {
  const newBadges: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    const alreadyHas = profile.badges.some(b => b.badgeId === badge.id);
    if (alreadyHas) continue;

    let qualifies = false;
    const { type, value } = badge.criteria;

    switch (type) {
      case 'posts':
        qualifies = profile.stats.posts >= value;
        break;
      case 'helpfulAnswers':
        qualifies = profile.stats.helpfulAnswers >= value;
        break;
      case 'verifiedAlerts':
        qualifies = profile.stats.verifiedAlerts >= value;
        break;
      case 'followers':
        qualifies = profile.stats.followers >= value;
        break;
      case 'following':
        qualifies = profile.stats.following >= value;
        break;
      case 'eventsAttended':
        qualifies = profile.stats.eventsAttended >= value;
        break;
      case 'placesDiscovered':
        qualifies = profile.stats.placesDiscovered >= value;
        break;
    }

    if (qualifies) {
      profile.badges.push({
        badgeId: badge.id,
        earnedAt: new Date()
      });
      newBadges.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    await profile.save();
  }

  return newBadges;
}

// GET /api/trust/score/:userId - Get trust score
router.get('/score/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await getOrCreateProfile(userId);

    const levelInfo = {
      badge: getLevelBadge(profile.level),
      color: getLevelColor(profile.level),
      abilities: getLevelAbilities(profile.level),
      nextLevel: getNextLevelInfo(profile.level, profile.score)
    };

    res.json({
      success: true,
      userId: profile.userId,
      score: profile.score,
      level: profile.level,
      levelInfo,
      verification: profile.verification,
      stats: profile.stats,
      badges: profile.badges.map(b => {
        const def = BADGE_DEFINITIONS.find(d => d.id === b.badgeId);
        return {
          ...b,
          name: def?.name,
          icon: def?.icon,
          rarity: def?.rarity
        };
      })
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/trust/badges/:userId - Get badges
router.get('/badges/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await getOrCreateProfile(userId);

    const badges = profile.badges.map(b => {
      const def = BADGE_DEFINITIONS.find(d => d.id === b.badgeId);
      return {
        id: b.badgeId,
        name: def?.name,
        icon: def?.icon,
        description: def?.description,
        rarity: def?.rarity,
        earnedAt: b.earnedAt,
        area: b.area
      };
    });

    // Get available badges
    const availableBadges = BADGE_DEFINITIONS.filter(d => !badges.some(b => b.id === d.id));

    res.json({
      success: true,
      earned: badges,
      available: availableBadges.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        description: b.description,
        rarity: b.rarity,
        criteria: b.criteria
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/trust/leaderboard - Get leaderboards
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'score', neighborhood, limit = 10, offset = 0 } = req.query;

    let query: Record<string, unknown> = {};

    if (neighborhood) {
      query['neighborhoods.neighborhoodId'] = neighborhood;
    }

    const leaders = await TrustProfile.find(query)
      .sort({ score: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const leaderboard = await Promise.all(leaders.map(async (profile, idx) => {
      const def = BADGE_DEFINITIONS.find(d => d.id === profile.badges[0]?.badgeId);
      return {
        rank: Number(offset) + idx + 1,
        userId: profile.userId,
        score: profile.score,
        level: profile.level,
        topBadge: def ? { icon: def.icon, name: def.name } : null,
        area: profile.area || profile.primaryNeighborhood
      };
    }));

    res.json({
      success: true,
      type,
      leaderboard
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/verify - Submit verification request
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = verificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { type, data, documents } = validation.data;

    // Check if verification already exists
    const existing = await VerificationRequest.findOne({
      userId,
      type,
      status: 'pending'
    });

    if (existing) {
      return res.status(409).json({ error: 'Verification already pending' });
    }

    const request = new VerificationRequest({
      userId,
      type,
      data,
      documents,
      status: 'pending'
    });

    await request.save();

    // Auto-approve for phone/email verification (simulated)
    if (type === 'phone' || type === 'email') {
      request.status = 'approved';
      request.verifiedAt = new Date();
      await request.save();

      // Update profile
      const profile = await getOrCreateProfile(userId);
      const verificationField = type as keyof typeof profile.verification;
      (profile.verification as Record<string, boolean>)[verificationField] = true;
      (profile.verificationDetails as Record<string, Date>)[`${type}VerifiedAt`] = new Date();

      const points = SCORE_WEIGHTS.verification[type as VerificationType];
      profile.score += points;

      // Check for level up
      const newLevel = calculateLevel(profile.score);
      if (newLevel !== profile.level) {
        profile.level = newLevel;
      }

      await profile.save();

      // Record event
      await TrustEvent.create({
        userId,
        type: 'verification',
        action: 'credit',
        points,
        reason: `${type} verification approved`
      });

      return res.json({
        success: true,
        verified: true,
        pointsAwarded: points,
        newLevel: profile.level
      });
    }

    res.json({
      success: true,
      requestId: request._id,
      message: 'Verification request submitted'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/verify/approve - Approve verification (admin)
router.post('/verify/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId, adminCode } = req.body;

    // In production, verify admin code
    const request = await VerificationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'approved';
    request.verifiedAt = new Date();
    await request.save();

    // Update profile
    const profile = await getOrCreateProfile(request.userId);
    const verificationField = request.type as keyof typeof profile.verification;
    (profile.verification as Record<string, boolean>)[verificationField] = true;
    (profile.verificationDetails as Record<string, Date>)[`${request.type}VerifiedAt`] = new Date();

    const points = SCORE_WEIGHTS.verification[request.type as VerificationType];
    profile.score += points;

    const newLevel = calculateLevel(profile.score);
    if (newLevel !== profile.level) {
      profile.level = newLevel;
    }

    await profile.save();

    // Record event
    await TrustEvent.create({
      userId: request.userId,
      type: 'verification',
      action: 'credit',
      points,
      reason: `${request.type} verification approved`
    });

    res.json({
      success: true,
      pointsAwarded: points,
      newLevel: profile.level
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/score/update - Update score
router.post('/score/update', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = scoreUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { type, action, points, reason, metadata } = validation.data;

    const profile = await getOrCreateProfile(userId);

    // Apply points
    if (action === 'credit') {
      profile.score += points;
    } else {
      profile.score = Math.max(0, profile.score - points);
    }

    // Update stats based on type
    const statsField = getStatsField(type);
    if (statsField && action === 'credit') {
      (profile.stats as Record<string, number>)[statsField] =
        ((profile.stats as Record<string, number>)[statsField] || 0) + 1;
    }

    // Check level
    const newLevel = calculateLevel(profile.score);
    let levelChanged = false;
    if (newLevel !== profile.level) {
      profile.level = newLevel;
      levelChanged = true;
    }

    // Check badges
    const newBadges = await checkAndAwardBadges(profile);

    await profile.save();

    // Record event
    await TrustEvent.create({
      userId,
      type,
      action,
      points: action === 'credit' ? points : -points,
      reason,
      metadata
    });

    res.json({
      success: true,
      newScore: profile.score,
      newLevel: profile.level,
      levelChanged,
      newBadges
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/trust/history/:userId - Get trust history
router.get('/history/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const events = await TrustEvent.find({ userId })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await TrustEvent.countDocuments({ userId });

    res.json({
      success: true,
      events,
      total,
      offset,
      limit
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/report - Report suspicious user
router.post('/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportedUserId, reason, evidence } = req.body;
    const reporterId = req.headers['x-user-id'] as string;

    if (!reporterId) {
      return res.status(401).json({ error: 'Reporter ID required' });
    }

    // Decrease trust score of reported user
    const profile = await TrustProfile.findOne({ userId: reportedUserId });
    if (profile) {
      profile.score = Math.max(0, profile.score - 10);
      await profile.save();

      await TrustEvent.create({
        userId: reportedUserId,
        type: 'report',
        action: 'debit',
        points: 10,
        reason: `Reported: ${reason}`,
        metadata: { reporterId, evidence }
      });
    }

    res.json({
      success: true,
      message: 'Report submitted'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/trust/neighborhoods - Get neighborhoods
router.get('/neighborhoods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, near, limit = 20 } = req.query;

    let query: Record<string, unknown> = {};
    if (type) {
      query.type = type;
    }

    const neighborhoods = await Neighborhood.find(query)
      .sort({ memberCount: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      neighborhoods
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/neighborhoods - Create neighborhood
router.post('/neighborhoods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = neighborhoodSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const neighborhood = new Neighborhood(validation.data);
    await neighborhood.save();

    res.json({
      success: true,
      neighborhood
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trust/neighborhoods/join - Join neighborhood
router.post('/neighborhoods/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { neighborhoodId } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const neighborhood = await Neighborhood.findById(neighborhoodId);
    if (!neighborhood) {
      return res.status(404).json({ error: 'Neighborhood not found' });
    }

    const profile = await getOrCreateProfile(userId);

    // Add to neighborhoods if not already
    const existing = profile.neighborhoods.find(n => n.neighborhoodId === neighborhoodId);
    if (!existing) {
      profile.neighborhoods.push({
        neighborhoodId: neighborhoodId,
        name: neighborhood.name,
        checkInCount: 1,
        lastCheckIn: new Date()
      });
      profile.primaryNeighborhood = neighborhoodId;
      profile.area = neighborhood.name;
    } else {
      existing.checkInCount += 1;
      existing.lastCheckIn = new Date();
    }

    await profile.save();

    // Update neighborhood member count
    neighborhood.memberCount += 1;
    neighborhood.activeMembers += 1;
    await neighborhood.save();

    res.json({
      success: true,
      neighborhood: neighborhood.name
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function getLevelBadge(level: TrustLevel): string {
  const badges: Record<TrustLevel, string> = {
    new: '🟢 New',
    verified: '✅ Verified',
    trusted: '⭐ Trusted',
    expert: '🏆 Expert',
    guardian: '🛡️ Guardian',
    legend: '👑 Legend'
  };
  return badges[level];
}

function getLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    new: '#22C55E',
    verified: '#3B82F6',
    trusted: '#F59E0B',
    expert: '#8B5CF6',
    guardian: '#EF4444',
    legend: '#FFD700'
  };
  return colors[level];
}

function getLevelAbilities(level: TrustLevel): string[] {
  const abilities: Record<TrustLevel, string[]> = {
    new: ['Basic features', 'Can browse', 'Can ask questions'],
    verified: ['Can post', 'Can comment', 'Can answer', 'Earn coins'],
    trusted: ['Can verify alerts', 'Priority in search', 'Featured answers'],
    expert: ['Expert badge', 'Featured slots', 'Boost visibility', 'Earn more coins'],
    guardian: ['Safety authority', 'Emergency access', 'Crisis response', 'Guardian badge'],
    legend: ['Community leader', 'All features', 'Exclusive events', 'Legend badge']
  };
  return abilities[level];
}

function getNextLevelInfo(currentLevel: TrustLevel, currentScore: number): { level: TrustLevel; pointsNeeded: number } | null {
  const levels: TrustLevel[] = ['new', 'verified', 'trusted', 'expert', 'guardian', 'legend'];
  const currentIndex = levels.indexOf(currentLevel);

  if (currentIndex === levels.length - 1) {
    return null; // Already at max level
  }

  const nextLevel = levels[currentIndex + 1];
  const threshold = LEVEL_THRESHOLDS[nextLevel];

  return {
    level: nextLevel,
    pointsNeeded: threshold - currentScore
  };
}

function getStatsField(type: string): string | null {
  const mapping: Record<string, string> = {
    post: 'posts',
    answer: 'answers',
    helpful_answer: 'helpfulAnswers',
    alert: 'alerts',
    verified_alert: 'verifiedAlerts',
    event_attended: 'eventsAttended',
    place_discovered: 'placesDiscovered',
    follow: 'following',
    followed: 'followers'
  };
  return mapping[type] || null;
}

export { router as trustRoutes };
