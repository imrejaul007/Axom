import { Request, Response, NextFunction } from 'express';
/**
 * Redis-backed sliding window rate limiter for admin endpoints.
 * Tracks requests per IP + path prefix to prevent abuse without
 * blocking legitimate concurrent requests from different IPs.
 */
export declare function adminRateLimit(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Admin Bearer token guard.
 * Set ADMIN_API_KEY env var — requests must include:
 *   Authorization: Bearer <ADMIN_API_KEY>
 */
export declare function adminAuth(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=adminAuth.d.ts.map