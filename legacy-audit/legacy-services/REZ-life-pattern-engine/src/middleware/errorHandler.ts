/**
 * REZ Life Pattern Engine - Error Handler Middleware
 * Centralized error handling for Express routes
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  /** HTTP status code */
  statusCode: number;
  /** Whether the error is operational (expected) */
  isOperational: boolean;

  /**
   * Creates a new ApiError
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   * @param isOperational - Whether this is an expected error (default: true)
   */
  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = "ApiError";

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Creates a 400 Bad Request error
   * @param message - Error message
   * @returns ApiError instance
   */
  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }

  /**
   * Creates a 404 Not Found error
   * @param message - Error message
   * @returns ApiError instance
   */
  static notFound(message: string): ApiError {
    return new ApiError(message, 404);
  }

  /**
   * Creates a 500 Internal Server Error
   * @param message - Error message
   * @returns ApiError instance
   */
  static internal(message: string): ApiError {
    return new ApiError(message, 500, false);
  }
}

/**
 * Global error handler middleware
 * Handles all errors thrown during request processing
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: "Validation Error",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Handle API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle unexpected errors
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 * @returns Express request handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    statusCode: 404,
  });
}