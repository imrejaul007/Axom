/**
 * Shared Auth Middleware for BuzzLocal Services
 * Handles JWT verification and user context
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'buzzlocal-dev-secret-change-in-prod';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role?: string;
  societyIds?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Generate JWT token
export function generateToken(user: AuthUser, expiresIn = '7d'): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}

// Auth middleware - extracts user from JWT
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Check for Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
  }

  // Fallback: Check x-user-id header (for internal services)
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.user = { id: userId };
    return next();
  }

  // Return 401 for protected routes
  return res.status(401).json({ error: 'Authentication required' });
}

// Optional auth - sets user if token present, but doesn't require it
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  // Fallback to x-user-id
  if (!req.user) {
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      req.user = { id: userId };
    }
  }

  next();
}

// Role-based access
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role || 'user')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Society membership check
export function requireSocietyMembership(societyIdParam = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const societyId = req.params[societyIdParam];

    // Check if user is a member of this society
    if (req.user.societyIds?.includes(societyId)) {
      return next();
    }

    // For development, allow all authenticated users
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    return res.status(403).json({ error: 'Not a member of this society' });
  };
}
