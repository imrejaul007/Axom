import { Request, Response, NextFunction } from 'express';
import { log } from '../config/telemetry';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  log.error({ err, statusCode: (err as { statusCode?: number }).statusCode }, '[Error]');
  res.status(500).json({ message: 'Internal server error' });
}
