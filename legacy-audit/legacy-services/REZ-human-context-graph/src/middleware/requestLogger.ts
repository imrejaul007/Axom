/**
 * Request logging middleware for Express.
 * @module middleware/requestLogger
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Extends Express Request to include timing information.
 */
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * Logs incoming requests with method, path, status code, and duration.
 * Only logs in non-test environments.
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip logging in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Record start time
  req.startTime = Date.now();

  // Log request start
  const startLog = `[${new Date().toISOString()}] ${req.method} ${req.path}`;
  console.log(startLog);

  // Capture response finish
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    console.log(logMessage);
  });

  next();
}