import type { Request, Response, NextFunction } from "express";
/**
 * Request logging middleware.
 *
 * Logs HTTP method, path, status, response time, and user agent
 * for every incoming request.
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map