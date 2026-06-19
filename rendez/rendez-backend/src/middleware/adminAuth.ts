import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';

const ADMIN_RATE_LIMIT = 120; // requests per window
const ADMIN_RATE_WINDOW = 60; // seconds

/**
 * Redis-backed sliding window rate limiter for admin endpoints.
 * Tracks requests per IP + path prefix to prevent abuse without
 * blocking legitimate concurrent requests from different IPs.
 */
export async function adminRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = (req.ip || req.socket.remoteAddress || 'unknown').replace(/:/g, '_');
  const pathKey = req.path.split('/').slice(0, 4).join('/'); // /admin/xxx
  const key = `ratelimit:admin:${ip}:${pathKey}`;
  const now = Date.now();
  const windowStart = now - ADMIN_RATE_WINDOW * 1000;

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);
    // Count requests in current window
    const count = await redis.zcard(key);
    if (count >= ADMIN_RATE_LIMIT) {
      res.status(429).json({
        message: 'RATE_LIMIT_EXCEEDED',
        retryAfter: ADMIN_RATE_WINDOW,
      });
      return;
    }
    // Add current request
    await redis.zadd(key, now, `${now}:${crypto.randomUUID()}`);
    // Expire key after window to auto-cleanup
    await redis.expire(key, ADMIN_RATE_WINDOW + 5);
    next();
  } catch {
    // Fail open — don't block requests if Redis is down
    next();
  }
}

/**
 * Admin Bearer token guard.
 * Set ADMIN_API_KEY env var — requests must include:
 *   Authorization: Bearer <ADMIN_API_KEY>
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    res.status(503).json({ message: 'ADMIN_NOT_CONFIGURED' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'MISSING_ADMIN_TOKEN' });
    return;
  }

  const token = authHeader.slice(7);

  // Constant-time comparison — prevents timing oracle on admin key
  const tokenBuf = Buffer.from(token);
  const keyBuf   = Buffer.from(adminKey);
  const valid = tokenBuf.length === keyBuf.length &&
    crypto.timingSafeEqual(tokenBuf, keyBuf);

  if (!valid) {
    res.status(403).json({ message: 'INVALID_ADMIN_TOKEN' });
    return;
  }

  next();
}
