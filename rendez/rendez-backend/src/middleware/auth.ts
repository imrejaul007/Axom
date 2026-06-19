import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyRezToken } from '../integrations/rez/rezAuthClient';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { log } from '../config/telemetry';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    rezUserId: string;
    phone: string;
  };
}

// Verify REZ JWT on first login, issue Rendez JWT
export async function rezAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
      ? authHeader.slice(7)
      : undefined;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const rezResult = await verifyRezToken(token);
    if (!rezResult.valid) return res.status(401).json({ message: 'Invalid REZ token' });
    if (rezResult.verified_status !== 'verified') {
      return res.status(403).json({ message: 'REZ account not verified' });
    }

    // Check if the REZ account is suspended
    const profile = await prisma.profile.findUnique({
      where: { id: rezResult.rez_user_id },
      select: { isSuspended: true },
    });
    if (profile?.isSuspended) {
      return res.status(403).json({ message: 'ACCOUNT_SUSPENDED. Your account has been suspended. Contact support.' });
    }

    (req as AuthRequest).user = {
      id: rezResult.rez_user_id,
      rezUserId: rezResult.rez_user_id,
      phone: rezResult.phone,
    };
    return next();
  } catch (err) {
    // RENDEZ-P1 FIX: Auth failures must always return 401. Returning 503 in production
    // incorrectly signals a temporary infrastructure issue rather than a credential problem,
    // which can cause clients to retry and potentially expose the endpoint to abuse.
    log.warn({ err }, '[AUTH] REZ token verify failed or Redis unavailable — denying request');
    res.status(401).json({ message: 'Authentication failed' });
  }
}

// Verify Rendez JWT (for subsequent requests)
export async function rendezAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
      ? authHeader.slice(7)
      : undefined;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; rezUserId: string };

    const profile = await prisma.profile.findUnique({
      where: { id: payload.sub, isActive: true },
      select: { id: true, rezUserId: true, phone: true, isSuspended: true },
    });

    if (!profile) return res.status(401).json({ message: 'Profile not found' });
    // RZ-B-H7 FIX: isSuspended is a non-optional Boolean field on the Profile model.
    // The unnecessary type cast weakened type safety. Use the field directly.
    if (profile.isSuspended) {
      return res.status(403).json({ message: 'ACCOUNT_SUSPENDED. Your account has been suspended. Contact support.' });
    }

    req.user = { id: profile.id, rezUserId: profile.rezUserId, phone: profile.phone };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'TOKEN_EXPIRED. Token has expired — please log in again' });
    }
    res.status(401).json({ message: 'INVALID_TOKEN. Invalid token' });
  }
}

export function issueRendezToken(profileId: string, rezUserId: string): string {
  return jwt.sign({ sub: profileId, rezUserId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * H-3 FIX: Type guard that asserts req.user is present.
 * Use this instead of non-null assertion (!) when you need a clean error path
 * rather than relying on TypeScript to trust the middleware chain.
 *
 * Usage: const user = requireUser(req, res); if (!user) return;
 */
export function requireUser(req: AuthRequest, res: import('express').Response): Required<AuthRequest>['user'] | null {
  if (!req.user) {
    res.status(401).json({ message: 'AUTH_REQUIRED. Authentication required' });
    return null;
  }
  return req.user;
}
