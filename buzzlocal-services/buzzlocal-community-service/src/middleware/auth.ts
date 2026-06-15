import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email: string; role: string };
  isInternalCall?: boolean;
}

function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET!) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export const internalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (token === INTERNAL_TOKEN) {
    req.isInternalCall = true;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const decoded = verifyToken(authHeader.substring(7));
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.id;
  req.user = decoded;
  next();
};

export const requireUserId = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId && !req.isInternalCall) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.role || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
