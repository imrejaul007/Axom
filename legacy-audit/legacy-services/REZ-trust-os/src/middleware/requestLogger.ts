/**
 * REZ Trust OS - Request Logger Middleware
 * @module middleware/requestLogger
 */

import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      console.error('[REQUEST]', JSON.stringify(log));
    } else {
      console.log('[REQUEST]', JSON.stringify(log));
    }
  });

  next();
}