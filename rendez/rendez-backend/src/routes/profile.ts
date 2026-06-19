import { Router, Response, NextFunction } from 'express';
import { rendezAuth, rezAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import { computeTrustSignals } from '../utils/trust';
import { defaultLimiter } from '../middleware/rateLimiter';
import { captureProfileView, captureProfileCreated } from '../services/intentCapture.service';
import { logger } from '../config/logger';

const router = Router();

function isValidId(id: string): boolean {
  // CUID: starts with 'c', alphanumeric, ~25 chars
  // UUID: 8-4-4-4-12 hex pattern
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const createSchema = z.object({
  name: z.string().min(2).max(50),
  bio: z.string().max(300).optional(),
  age: z.number().int().min(18).max(60),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY']),
  interestedIn: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY'])).min(1),
  intent: z.enum(['DATING', 'FRIENDSHIP', 'NETWORKING']).optional(),
  city: z.string().min(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Profile creation uses rezAuth: new users have a token with sub=rezUserId (no profile ID yet)
router.post('/', rezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const existing = await prisma.profile.findUnique({ where: { rezUserId: req.user!.rezUserId } });
    if (existing) throw new AppError(409, 'Profile already exists');

    const profile = await prisma.profile.create({
      data: {
        ...data,
        rezUserId: req.user!.rezUserId,
        phone: req.user!.phone,
      },
    });

    // RTMN Commerce Memory: Capture profile creation intent (non-blocking)
    captureProfileCreated({
      userId: profile.id,
      profileId: profile.id,
      intent: data.intent,
    }).catch((err) => logger.warn('[IntentCapture] Failed to capture profile created', { error: err, profileId: profile.id }));

    res.status(201).json(profile);
  } catch (err) { next(err); }
});

router.get('/me', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: req.user!.id } });
    if (!profile) throw new AppError(404, 'Profile not found');
    res.json(profile);
  } catch (err) { next(err); }
});

// RZ-M-B1: age added to PATCH schema for server-side age verification on updates.
// Previously age was only validated at creation time. Now users can update their age
// and it must pass server-side range validation (18-60).
const patchSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  intent: z.enum(['DATING', 'FRIENDSHIP', 'NETWORKING']).optional(),
  interestedIn: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY'])).min(1).optional(),
  city: z.string().min(2).max(60).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  // RZ-M-B1: age field with server-side range validation
  age: z.number().int().min(18).max(60).optional(),
  // photos must be Cloudinary URLs (https://res.cloudinary.com/...) — max 6
  photos: z.array(
    z.string().url().regex(/^https:\/\/res\.cloudinary\.com\//, 'Only Cloudinary URLs allowed')
  ).max(6).optional(),
  // Sprint 12: safety settings
  requireMessageRequest: z.boolean().optional(),
  verifiedOnly:          z.boolean().optional(),
  onlyVerifiedCanLike:   z.boolean().optional(),
});

router.patch('/me', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updates = patchSchema.parse(req.body);
    // H-6 FIX: prisma.update returns the mutated record directly — no need for a
    // separate findUnique call. The returned object is always the fresh DB state.
    const profile = await prisma.profile.update({
      where: { id: req.user!.id },
      data: updates,
    });
    res.json(profile);
  } catch (err) { next(err); }
});

// GET /api/v1/profile/:id — public profile view (used by ProfileDetailScreen)
// Strips private fields; checks block relationship
// RD-M-14 FIX: Apply rate limiting to prevent profile enumeration attacks.
router.get('/:id', rendezAuth, defaultLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'INVALID_ID' });
    }
    const viewerId = req.user!.id;

    // Check block in either direction
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: id },
          { blockerId: id,       blockedId: viewerId },
        ],
      },
    });
    if (block) throw new AppError(404, 'Profile not found');

    const profile = await prisma.profile.findUnique({
      where: { id, isActive: true, isSuspended: false },
      select: {
        id: true, name: true, age: true, gender: true, city: true,
        bio: true, photos: true, intent: true, isVerified: true,
        profileScore: true, rezSpendScore: true,
        meetupCount: true, responseRate: true, lastActiveAt: true,
        createdAt: true,
      },
    });
    if (!profile) throw new AppError(404, 'Profile not found');

    // RTMN Commerce Memory: Capture profile view intent (non-blocking)
    captureProfileView({
      userId: viewerId,
      viewedUserId: id,
      intent: profile.intent as 'DATING' | 'FRIENDSHIP' | 'NETWORKING',
    }).catch((err) => logger.warn('[IntentCapture] Failed to capture profile view', { error: err, viewedUserId: id }));

    const trustSignals = computeTrustSignals(profile);
    res.json({ ...profile, trustSignals });
  } catch (err) { next(err); }
});

// DELETE /api/v1/profile/me — hard delete (user-initiated account deletion)
router.delete('/me', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Soft-delete: deactivate + anonymise PII so related records stay intact
    await prisma.profile.update({
      where: { id: req.user!.id },
      data: {
        isActive: false,
        name: 'Deleted User',
        bio: null,
        photos: [],
        city: 'Unknown',
      },
    });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
