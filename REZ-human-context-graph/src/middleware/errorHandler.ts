/**
 * Error handling middleware for Express.
 * @module middleware/errorHandler
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom error class with status code.
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  /**
   * Creates a new AppError instance.
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   */
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error for missing resources.
 */
export class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError instance.
   * @param resource - Name of the missing resource
   */
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Validation error for invalid input.
 */
export class ValidationError extends AppError {
  details: unknown;

  /**
   * Creates a ValidationError instance.
   * @param message - Error message
   * @param details - Additional validation details
   */
  constructor(message: string, details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Error handler middleware that processes all errors.
 * Handles different error types including Zod validation errors.
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param _next - Express next function
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof ValidationError && { details: err.details }),
    });
    return;
  }

  // Handle unexpected errors
  const statusCode = (err as AppError).statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers.
 * @param fn - Async function to wrap
 * @returns Express request handler with error catching
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}