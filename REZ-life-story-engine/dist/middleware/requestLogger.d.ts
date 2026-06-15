/**
 * Request logging middleware
 * @module middleware/requestLogger
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Logs incoming requests with method, path, and duration
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * CORS headers middleware
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
export declare function corsHeaders(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map