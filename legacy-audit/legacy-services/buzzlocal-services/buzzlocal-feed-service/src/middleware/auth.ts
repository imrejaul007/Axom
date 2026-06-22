import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Fail startup if secrets missing in production
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email: string; role: string };
  isInternalCall?: boolean;
}

/**
 * Verify JWT token
 */
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET!) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Internal service authentication
 */
export const internalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  // Check internal token first
  if (token === INTERNAL_TOKEN) {
    req.isInternalCall = true;
    return next();
  }

  // Check Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const tokenValue = authHeader.substring(7);
  if (!tokenValue) {
    return res.status(401).json({ error: 'Token required' });
  }

  const decoded = verifyToken(tokenValue);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.id;
  req.user = decoded;
  next();
};

/**
 * Require user ID (must be set by internalAuth)
 */
export const requireUserId = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId && !req.isInternalCall) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Require admin role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.role || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
