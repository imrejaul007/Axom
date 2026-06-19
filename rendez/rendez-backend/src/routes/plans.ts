import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { PlanService } from '../services/PlanService';
import { planApplyLimiter, defaultLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { z } from 'zod';
import { PlanCategory, PlanVibe, GenderPref, PlanVisibility } from '@prisma/client';
import { captureDatePlanned } from '../services/intentCapture.service';

/** RZ-B-H2 FIX: Validate CUID/UUID plan IDs before passing to Prisma.
 * Malformed IDs cause a Prisma runtime error (500) instead of a clean 400. */
function isValidId(id: string): boolean {
  return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const router  = Router();
const planSvc = new PlanService();

// ─── Validation schemas ───────────────────────────────────────────────────────

const createSchema = z.object({
  category:            z.nativeEnum(PlanCategory),
  merchantId:          z.string().min(1),
  merchantName:        z.string().min(1).max(100),
  rezBookingRef:       z.string().min(1),
  title:               z.string().min(4).max(120),
  scheduledAt:         z.string().datetime(),
  city:                z.string().min(2),
  genderPreference:    z.nativeEnum(GenderPref).optional(),
  ageMin:              z.number().int().min(18).max(60).optional(),
  ageMax:              z.number().int().min(18).max(60).optional(),
  visibility:          z.nativeEnum(PlanVisibility).optional(),
  verifiedOnly:        z.boolean().optional(),
  vibe:                z.nativeEnum(PlanVibe).optional(),
  experienceCreditId:  z.string().cuid().optional(),
});

const applySchema = z.object({
  note: z.string().max(500).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/plans — create a plan
router.post('/', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const plan = await planSvc.createPlan({
      ...data,
      organizerId:        req.user!.id,
      scheduledAt:        new Date(data.scheduledAt),
      experienceCreditId: data.experienceCreditId,
    });

    // RTMN Commerce Memory: Capture date planned intent (non-blocking)
    captureDatePlanned({
      userId: req.user!.id,
      matchId: data.rezBookingRef,
      venue: data.merchantName,
      dateType: data.category,
    }).catch((err) => logger.warn('[IntentCapture] Failed to capture date planned', { error: err, matchId: data.rezBookingRef }));

    res.status(201).json(plan);
  } catch (err) { next(err); }
});

// GET /api/v1/plans/feed — personalised feed
// RD-M-12 FIX: Apply rate limiting to prevent abuse of expensive multi-join query.
router.get('/feed', rendezAuth, defaultLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await planSvc.getFeed(req.user!.id, {
      city:    req.query.city as string,
      explore: req.query.explore === 'true',
      cursor:  req.query.cursor as string,
    });
    res.json(plans);
  } catch (err) { next(err); }
});

// GET /api/v1/plans/mine — my organized + applied plans
router.get('/mine', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await planSvc.getMyPlans(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/plans/:id — plan detail
router.get('/:id', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    const plan = await planSvc.getPlan(req.params.id, req.user!.id);
    res.json(plan);
  } catch (err) { next(err); }
});

// POST /api/v1/plans/:id/apply — apply to a plan
router.post('/:id/apply', rendezAuth, planApplyLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { note } = applySchema.parse(req.body);
    try {
      const application = await planSvc.applyToPlan(req.params.id, req.user!.id, note);
      res.status(201).json(application);
    } catch (applyErr: unknown) {
      // Handle duplicate key error (unique constraint on userId + planId)
      if (
        typeof applyErr === 'object' &&
        applyErr !== null &&
        'code' in applyErr &&
        (applyErr as { code: string }).code === 'P2002'
      ) {
        res.status(409).json({ message: 'Already applied to this plan' });
        return;
      }
      throw applyErr;
    }
  } catch (err) { next(err); }
});

// DELETE /api/v1/plans/:id/apply — withdraw application
router.delete('/:id/apply', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    await planSvc.withdrawApplication(req.params.id, req.user!.id);
    res.json({ withdrawn: true });
  } catch (err) { next(err); }
});

// GET /api/v1/plans/:id/applications — organizer sees all applicants (ranked)
router.get('/:id/applications', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    const applications = await planSvc.getApplications(req.params.id, req.user!.id);
    res.json(applications);
  } catch (err) { next(err); }
});

// POST /api/v1/plans/:id/select/:applicantId — organizer selects
router.post('/:id/select/:applicantId', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    if (!req.params.applicantId || !isValidId(req.params.applicantId)) return res.status(400).json({ message: 'Invalid applicant ID' });
    const result = await planSvc.selectApplicant(req.params.id, req.user!.id, req.params.applicantId);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/plans/:id/reselect/:applicantId — organizer reselects after ghost
router.post('/:id/reselect/:applicantId', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    if (!req.params.applicantId || !isValidId(req.params.applicantId)) return res.status(400).json({ message: 'Invalid applicant ID' });
    const result = await planSvc.reselect(req.params.id, req.user!.id, req.params.applicantId);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/plans/:id/confirm — attendance confirmation
router.post('/:id/confirm', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    const result = await planSvc.confirmAttendance(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/plans/:id/cancel — organizer cancels
router.post('/:id/cancel', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid plan ID' });
    const result = await planSvc.cancelPlan(req.params.id, req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
