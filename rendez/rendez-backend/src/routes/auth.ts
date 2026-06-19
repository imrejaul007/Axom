import { Router, Request, Response, NextFunction } from 'express';
import { rezAuth, issueRendezToken } from '../middleware/auth';
import { prisma } from '../config/database';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/verify', authLimiter, rezAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as Request & { user: { rezUserId: string; phone: string } };

    const profile = await prisma.profile.findUnique({ where: { rezUserId: user.rezUserId } });

    // Only embed the Prisma profile CUID as JWT `sub` when the profile exists.
    // If the user has no profile yet, do not issue a Rendez token — the client
    // must call POST /api/v1/profile first, then call /verify again to get a token.
    // Previously: issueRendezToken(profile?.id || user.rezUserId) would set `sub`
    // to the REZ user ID for new users, making rendezAuth permanently fail for them.
    const token = profile ? issueRendezToken(profile.id, user.rezUserId) : null;

    res.json({
      token,
      hasProfile: !!profile,
      profile: profile
        ? { id: profile.id, name: profile.name, photos: profile.photos }
        : null,
    });
  } catch (err) { next(err); }
});

export default router;
