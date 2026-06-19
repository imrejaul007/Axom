import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { DiscoveryService } from '../services/DiscoveryService';
import { AppError } from '../middleware/errorHandler';
import { defaultLimiter } from '../middleware/rateLimiter';

const router = Router();
const discovery = new DiscoveryService();

const VALID_INTENTS = ['DATING', 'FRIENDSHIP', 'NETWORKING'] as const;
const VALID_CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'] as const;

router.get('/', rendezAuth, defaultLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { city, minAge, maxAge, intent } = req.query;

    const minAgeNum = minAge ? parseInt(minAge as string) : undefined;
    const maxAgeNum = maxAge ? parseInt(maxAge as string) : undefined;
    if ((minAgeNum !== undefined && isNaN(minAgeNum)) || (maxAgeNum !== undefined && isNaN(maxAgeNum))) {
      throw new AppError(400, 'minAge and maxAge must be integers');
    }
    if (minAgeNum !== undefined && (minAgeNum < 18 || minAgeNum > 60)) {
      throw new AppError(400, 'minAge must be between 18 and 60');
    }
    if (maxAgeNum !== undefined && (maxAgeNum < 18 || maxAgeNum > 60)) {
      throw new AppError(400, 'maxAge must be between 18 and 60');
    }

    // RD-H-02 FIX: Explicit enum validation — reject invalid intent values instead of
    // passing arbitrary strings through to Prisma (even though Prisma handles them gracefully).
    const intentVal = (intent as string | undefined);
    const validatedIntent = intentVal && VALID_INTENTS.includes(intentVal as typeof VALID_INTENTS[number])
      ? intentVal as typeof VALID_INTENTS[number]
      : undefined;

    // RD-M-04 FIX: Validate city param length to prevent abuse.
    const cityVal = (city as string | undefined);
    const validatedCity = cityVal && cityVal.length <= 60 ? cityVal : undefined;

    const feed = await discovery.getFeed(req.user!.id, {
      city: validatedCity,
      minAge: minAgeNum,
      maxAge: maxAgeNum,
      intent: validatedIntent,
    });
    res.json(feed);
  } catch (err) { next(err); }
});

export default router;
