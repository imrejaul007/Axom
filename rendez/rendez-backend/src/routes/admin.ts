import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { adminAuth, adminRateLimit } from '../middleware/adminAuth';
import { log } from '../config/telemetry';

const router = Router();

// RD-M-16 FIX: Dedicated login endpoint so admin frontend validates credentials via
// POST /admin/login instead of hitting /admin/stats (a GET that returns dashboard
// data and should not be used as a credential probe).
router.post('/login', adminRateLimit, async (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) { res.status(503).json({ message: 'ADMIN_NOT_CONFIGURED' }); return; }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'MISSING_ADMIN_TOKEN' }); return;
  }

  const token = authHeader.slice(7);
  // Constant-time comparison — prevents timing oracle on admin key
  const tokenBuf = Buffer.from(token);
  const keyBuf   = Buffer.from(adminKey);
  if (tokenBuf.length !== keyBuf.length ||
      !crypto.timingSafeEqual(tokenBuf, keyBuf)) {
    res.status(403).json({ message: 'INVALID_ADMIN_TOKEN' }); return;
  }

  res.json({ ok: true });
});

// RD-CR-01 FIX: Apply adminAuth middleware to all admin routes.
// Without this, all 14 admin endpoints are unauthenticated and publicly accessible.
router.use(adminRateLimit);
router.use(adminAuth);

// Async error wrapper — forwards thrown errors to Express global error handler
const ar = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

const VALID_REPORT_STATUSES = ['PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'] as const;

// RD-HIGH-02 FIX: Typed enum validators replace `as any` casts in Prisma where clauses.
// Each validator returns the value only if it matches the allowed set, otherwise undefined.
// This prevents invalid values from reaching Prisma.
const VALID_GIFT_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'REDEEMED', 'EXPIRED'] as const;
const VALID_GIFT_TYPES   = ['COIN', 'MERCHANT_VOUCHER'] as const;
const VALID_REWARD_STATUSES = ['PENDING', 'TRIGGERED', 'FAILED'] as const;
const VALID_PLAN_STATUSES  = ['OPEN', 'FILLED', 'CANCELLED', 'COMPLETED', 'EXPIRED'] as const;

function enumVal<T extends string>(val: string | undefined, allowed: readonly string[]): T | undefined {
  return val != null && allowed.includes(val) ? (val as T) : undefined;
}

// GET /admin/stats — dashboard numbers
router.get('/stats', ar(async (_req, res) => {
  const [
    totalProfiles,
    totalMatches,
    totalGifts,
    pendingReports,
    activeGifts,
    validatedMeetups,
    fraudFlags,
  ] = await Promise.all([
    prisma.profile.count({ where: { isActive: true } }),
    prisma.match.count({ where: { status: 'ACTIVE' } }),
    prisma.gift.count(),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.gift.count({ where: { status: 'PENDING' } }),
    prisma.reward.count({ where: { status: 'TRIGGERED' } }),
    prisma.fraudFlag.count({ where: { resolved: false } }),
  ]);

  const giftValueResult = await prisma.gift.aggregate({
    _sum: { amountPaise: true },
    where: { status: { in: ['ACCEPTED', 'REDEEMED'] } },
  });

  res.json({
    totalProfiles, totalMatches, totalGifts, pendingReports,
    activeGifts, validatedMeetups, fraudFlags,
    giftValueAcceptedPaise: giftValueResult._sum.amountPaise || 0,
  });
}));

// GET /admin/reports
router.get('/reports', ar(async (req, res) => {
  const { status = 'PENDING', limit = '50', cursor } = req.query;
  if (!VALID_REPORT_STATUSES.includes(status as typeof VALID_REPORT_STATUSES[number])) {
    res.status(400).json({ message: 'Invalid status filter' });
    return;
  }
  const take = Math.min(parseInt(limit as string) || 50, 200);
  const reports = await prisma.report.findMany({
    where: { status: status as typeof VALID_REPORT_STATUSES[number] },
    include: {
      reporter: { select: { id: true, name: true } },
      reported: { select: { id: true, name: true, city: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
  });
  res.json(reports);
}));

// PATCH /admin/reports/:id
router.patch('/reports/:id', ar(async (req, res) => {
  const { status, reviewedBy } = req.body;
  if (!status || !VALID_REPORT_STATUSES.includes(status)) {
    res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_REPORT_STATUSES.join(', ')}` });
    return;
  }
  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status, reviewedBy: reviewedBy ?? null, reviewedAt: new Date() },
  });
  res.json(report);
}));

// GET /admin/fraud
router.get('/fraud', ar(async (req, res) => {
  const { type, resolved, limit = '100', cursor } = req.query;
  const take = Math.min(parseInt(limit as string) || 100, 500);
  const flags = await prisma.fraudFlag.findMany({
    where: {
      ...(type && { type: type as 'GIFT_SPAM' | 'REWARD_FARMING' | 'MULTIPLE_ACCOUNTS' | 'FAKE_CHECKIN' }),
      ...(resolved !== undefined && { resolved: resolved === 'true' }),
    },
    include: { user: { select: { id: true, name: true, phone: true, city: true } } },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });
  res.json(flags);
}));

// PATCH /admin/fraud/:id/resolve
router.patch('/fraud/:id/resolve', ar(async (req, res) => {
  const flag = await prisma.fraudFlag.update({ where: { id: req.params.id }, data: { resolved: true } });
  res.json(flag);
}));

// GET /admin/users
router.get('/users', ar(async (req, res) => {
  const { city, isVerified, isActive, search, limit = '100', cursor } = req.query;
  if (typeof city === 'string' && city.length > 100) {
    res.status(400).json({ message: 'city too long' });
    return;
  }
  if (typeof search === 'string' && search.length > 100) {
    res.status(400).json({ message: 'search too long' });
    return;
  }
  const take = Math.min(parseInt(limit as string) || 100, 500);
  const users = await prisma.profile.findMany({
    where: {
      ...(city && { city: city as string }),
      ...(isVerified !== undefined && { isVerified: isVerified === 'true' }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && { name: { contains: search as string, mode: 'insensitive' } }),
    },
    select: {
      id: true, name: true, phone: true, age: true, gender: true,
      city: true, intent: true, isVerified: true, isActive: true,
      isSuspended: true, profileScore: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });
  res.json(users);
}));

// PATCH /admin/users/:id/suspend
router.patch('/users/:id/suspend', ar(async (req, res) => {
  const profile = await prisma.profile.update({
    where: { id: req.params.id },
    data: { isActive: false, isSuspended: true },
  });
  res.json({ suspended: true, id: profile.id });
}));

// PATCH /admin/users/:id/unsuspend
router.patch('/users/:id/unsuspend', ar(async (req, res) => {
  const profile = await prisma.profile.update({
    where: { id: req.params.id },
    data: { isActive: true, isSuspended: false },
  });
  res.json({ suspended: false, id: profile.id });
}));

// GET /admin/gifts
router.get('/gifts', ar(async (req, res) => {
  const { status, type, limit = '500', cursor } = req.query;
  const statusVal = enumVal<typeof VALID_GIFT_STATUSES[number]>(status as string | undefined, VALID_GIFT_STATUSES);
  const typeVal   = enumVal<typeof VALID_GIFT_TYPES[number]>(type as string | undefined, VALID_GIFT_TYPES);
  const take = Math.min(parseInt(limit as string) || 500, 1000);
  const gifts = await prisma.gift.findMany({
    where: {
      ...(statusVal && { status: statusVal }),
      ...(typeVal   && { giftType: typeVal }),
    },
    include: {
      sender: { select: { name: true } },
      receiver: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });
  res.json(gifts);
}));

// GET /admin/stats/timeseries?days=7
// Each day is fetched in parallel across all days to avoid sequential 30-iteration bottleneck
router.get('/stats/timeseries', ar(async (req, res) => {
  const days = Math.min(parseInt(req.query.days as string) || 7, 30);

  const dayRanges = Array.from({ length: days }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (days - 1 - i));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  // Run ALL days in parallel (was sequential — up to 30 iterations × 4 queries = 120 round-trips)
  const result = await Promise.all(
    dayRanges.map(async ({ start, end }) => {
      const [matches, gifts, meetups, newUsers] = await Promise.all([
        prisma.match.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.gift.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.reward.count({ where: { createdAt: { gte: start, lte: end }, status: 'TRIGGERED' } }),
        prisma.profile.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      return {
        date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        matches, gifts, meetups, newUsers,
      };
    }),
  );

  res.json(result);
}));

// GET /admin/meetups — N+1 fix: fetch all checkins for all bookingIds in one query
router.get('/meetups', ar(async (req, res) => {
  const { status, limit = '200', cursor } = req.query;

  const rewardStatusVal = enumVal<typeof VALID_REWARD_STATUSES[number]>(status as string | undefined, VALID_REWARD_STATUSES);
  const take = Math.min(parseInt(limit as string) || 200, 500);
  const rewards = await prisma.reward.findMany({
    where: rewardStatusVal ? { status: rewardStatusVal } : undefined,
    include: {
      match: {
        include: {
          user1: { select: { name: true } },
          user2: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });

  // Batch-fetch all checkins for all bookingIds — one query instead of N
  const bookingIds = [...new Set(rewards.map((r) => r.bookingId))];
  const allCheckins = await prisma.meetupCheckin.findMany({
    where: { bookingId: { in: bookingIds } },
    select: { rezMerchantId: true, checkedInAt: true, userId: true, bookingId: true, matchId: true },
  });

  const checkinsByKey = new Map<string, typeof allCheckins>();
  for (const c of allCheckins) {
    const key = `${c.matchId}:${c.bookingId}`;
    if (!checkinsByKey.has(key)) checkinsByKey.set(key, []);
    checkinsByKey.get(key)!.push(c);
  }

  const enriched = rewards.map((r) => {
    const checkins = checkinsByKey.get(`${r.matchId}:${r.bookingId}`) || [];
    return {
      id: r.id,
      matchId: r.matchId,
      bookingId: r.bookingId,
      users: `${r.match?.user1?.name || '?'} & ${r.match?.user2?.name || '?'}`,
      checkinCount: checkins.length,
      merchantId: checkins[0]?.rezMerchantId || null,
      checkedInAt: checkins[0]?.checkedInAt || null,
      rewardStatus: r.status,
      rezRewardRef: r.rezRewardRef,
      triggeredAt: r.triggeredAt,
      createdAt: r.createdAt,
    };
  });

  const merchantCounts: Record<string, number> = {};
  enriched.forEach((r) => {
    if (r.merchantId) merchantCounts[r.merchantId] = (merchantCounts[r.merchantId] || 0) + 1;
  });

  res.json({
    meetups: enriched,
    merchantBreakdown: Object.entries(merchantCounts)
      .map(([merchantId, count]) => ({ merchantId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    totals: {
      total: enriched.length,
      validated: enriched.filter((r) => r.checkinCount >= 2).length,
      rewarded: enriched.filter((r) => r.rewardStatus === 'TRIGGERED').length,
      failed: enriched.filter((r) => r.rewardStatus === 'FAILED').length,
    },
  });
}));

// ─── Plans admin (Sprint 11) ────────────────────────────────────────────────

// GET /admin/plans
router.get('/plans', ar(async (req, res) => {
  const { status, city, limit = '200', cursor } = req.query;
  const planStatusVal = enumVal<typeof VALID_PLAN_STATUSES[number]>(status as string | undefined, VALID_PLAN_STATUSES);
  const take = Math.min(parseInt(limit as string) || 200, 500);
  const plans = await prisma.plan.findMany({
    where: {
      ...(planStatusVal && { status: planStatusVal }),
      ...(city && { city: city as string }),
    },
    include: {
      organizer: { select: { id: true, name: true, phone: true, isVerified: true } },
      _count: { select: { applications: true, confirmations: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });
  res.json(plans);
}));

// PATCH /admin/plans/:id/cancel
router.patch('/plans/:id/cancel', ar(async (req, res) => {
  const { reason } = req.body;
  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });
  // Log the admin cancel reason if provided
  if (reason) {
    await prisma.fraudFlag.create({
      data: {
        userId: plan.organizerId,
        type: 'REWARD_FARMING',
        detail: `Admin cancelled plan ${plan.id}: ${reason}`,
      },
    }).catch((err: unknown) => {
      log.error({ err, planId: plan.id }, '[Admin] Failed to create fraudFlag for plan cancellation');
    });
  }
  res.json({ cancelled: true, id: plan.id });
}));

// GET /admin/plans/stats — summary for Rendez partner API
router.get('/plans/stats', ar(async (_req, res) => {
  const [totalPlans, openPlans, filledPlans, completedPlans, cancelledPlans] = await Promise.all([
    prisma.plan.count(),
    prisma.plan.count({ where: { status: 'OPEN' } }),
    prisma.plan.count({ where: { status: 'FILLED' } }),
    prisma.plan.count({ where: { status: 'COMPLETED' } }),
    prisma.plan.count({ where: { status: 'CANCELLED' } }),
  ]);
  const [totalApplications, totalConfirmations] = await Promise.all([
    prisma.planApplication.count(),
    prisma.planConfirmation.count(),
  ]);
  res.json({
    totalPlans, openPlans, filledPlans, completedPlans, cancelledPlans,
    totalApplications, totalConfirmations,
  });
}));

/**
 * POST /admin/coordinator/create-plan
 * Coordinator tool: create a seeded Plan on behalf of a venue partner.
 * Finds or auto-creates a coordinator profile by phone number,
 * then creates the Plan with that profile as organizer.
 * Requires admin key — never exposed to end-users.
 */
router.post('/coordinator/create-plan', ar(async (req, res) => {
  const {
    organizerPhone,
    organizerName,
    title,
    category,
    city,
    merchantName,
    merchantId,
    scheduledAt,
    expiresAt,
    maxApplicants = 5,
    vibe,
    description,
    verifiedOnly = false,
    // P3: Merchant sponsorship
    isSponsored = false,
    sponsorBudgetCoins = 0,
    sponsorPerAttendeeCoins = 100,
  } = req.body;

  if (!organizerPhone || !title || !category || !city || !scheduledAt || !expiresAt) {
    res.status(400).json({ message: 'organizerPhone, title, category, city, scheduledAt, expiresAt are required' });
    return;
  }

  // RD-L-05 FIX: Validate phone format before auto-creating a Profile.
  // Indian mobile numbers are 10 digits (optionally with +91 prefix).
  // Without this, malformed phone values would be stored in the database.
  const phoneDigits = organizerPhone.replace(/\D/g, '');
  if (!/^91[6-9]\d{9}$/.test(phoneDigits)) {
    res.status(400).json({ message: 'organizerPhone must be a valid Indian mobile number (+91XXXXXXXXXX)' });
    return;
  }

  // Find or auto-create a coordinator profile for this phone number
  let organizer = await prisma.profile.findUnique({ where: { phone: organizerPhone } });
  if (!organizer) {
    organizer = await prisma.profile.create({
      data: {
        rezUserId:   `coord_${organizerPhone.replace(/\D/g, '')}`,
        phone:       organizerPhone,
        name:        organizerName || 'Coordinator',
        age:         25,
        gender:      'FEMALE',   // default to female for feed boost
        interestedIn: ['MALE', 'FEMALE', 'NON_BINARY'],
        city,
        isVerified:  true,       // coordinator profiles are pre-verified
      },
    });
  }

  const plan = await prisma.plan.create({
    data: {
      organizerId:          organizer.id,
      title,
      category,
      city,
      merchantName:         merchantName || city,
      merchantId:           merchantId || 'COORDINATOR',
      rezBookingRef:        crypto.randomBytes(8).toString('hex'),
      scheduledAt:          new Date(scheduledAt),
      expiresAt:            new Date(expiresAt),
      confirmationDeadline: new Date(expiresAt),
      capacity:             maxApplicants,
      vibe:                 vibe || null,
      verifiedOnly,
      status:               'OPEN',
      visibility:           'PUBLIC',
      // P3: Merchant sponsorship
      isSponsored:          isSponsored && sponsorBudgetCoins > 0,
      sponsorBudgetCoins,
      sponsorPerAttendeeCoins: sponsorPerAttendeeCoins,
    },
    include: { organizer: { select: { id: true, name: true, phone: true } } },
  });

  res.status(201).json({ plan });
}));

// PATCH /admin/plans/:id/sponsor — update sponsorship for a plan
router.patch('/plans/:id/sponsor', ar(async (req, res) => {
  const { isSponsored, sponsorBudgetCoins, sponsorPerAttendeeCoins } = req.body;
  if (typeof isSponsored !== 'boolean' && typeof sponsorBudgetCoins !== 'number' && typeof sponsorPerAttendeeCoins !== 'number') {
    res.status(400).json({ message: 'isSponsored, sponsorBudgetCoins, or sponsorPerAttendeeCoins required' });
    return;
  }
  const plan = await prisma.plan.update({
    where: { id: req.params.id },
    data: {
      ...(typeof isSponsored !== 'undefined' && { isSponsored }),
      ...(typeof sponsorBudgetCoins !== 'undefined' && { sponsorBudgetCoins }),
      ...(typeof sponsorPerAttendeeCoins !== 'undefined' && { sponsorPerAttendeeCoins }),
    },
  });
  res.json(plan);
}));

// GET /admin/plans/sponsored — list sponsored plans with budget tracking
router.get('/plans/sponsored', ar(async (req, res) => {
  const { city } = req.query;
  const plans = await prisma.plan.findMany({
    where: {
      isSponsored: true,
      ...(city && { city: city as string }),
    },
    select: {
      id: true, title: true, city: true, status: true, scheduledAt: true,
      sponsorBudgetCoins: true, sponsorSpentCoins: true, sponsorPerAttendeeCoins: true,
      merchantName: true, _count: { select: { confirmations: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(plans);
}));

// GET /admin/coordinator/plans — list coordinator-created plans
router.get('/coordinator/plans', ar(async (req, res) => {
  const { city, status, limit = '100', cursor } = req.query;
  const take = Math.min(parseInt(limit as string) || 100, 500);
  const plans = await prisma.plan.findMany({
    where: {
      ...(city   ? { city: { contains: city as string, mode: 'insensitive' } } : {}),
      ...(status ? { status: enumVal<typeof VALID_PLAN_STATUSES[number]>(status as string, VALID_PLAN_STATUSES) ?? {} } : {}),
      organizer: { rezUserId: { startsWith: 'coord_' } },
    },
    include: {
      organizer: { select: { name: true, phone: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor as string } } : {}),
  });
  res.json({ plans });
}));

export default router;
