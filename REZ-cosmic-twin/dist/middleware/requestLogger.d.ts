import { Request, Response, NextFunction } from "express";
/**
 * Request logging middleware.
 *
 * Logs method, path, status code, and response time for each request.
 * Uses console.log for simplicity; swap for a structured logger in production.
 *
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map