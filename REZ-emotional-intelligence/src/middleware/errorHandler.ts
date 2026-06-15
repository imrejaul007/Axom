import { Request, Response, NextFunction } from 'express';

/**
 * Standard error class for application errors with status codes.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   */
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware.
 * Catches errors passed via next(error) and formats a consistent JSON response.
 * @param {Error & { statusCode?: number }} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next function
 */
export function errorHandler(
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    res.status(statusCode).json({
      error: err.name ?? 'Error',
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    return;
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : err.name ?? 'Error',
    message,
  });
}
