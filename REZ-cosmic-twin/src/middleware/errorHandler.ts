import { Request, Response, NextFunction } from "express";

/**
 * Application-level error class for typed error handling.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global error handler middleware.
 *
 * Catches all thrown errors and returns a consistent JSON error response.
 * Unknown errors are treated as 500 Internal Server Errors.
 *
 * @param err - The caught error (may be AppError or generic Error).
 * @param _req - Express request object.
 * @param res - Express response object.
 * @param _next - Express next function (unused).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;

  const statusCode = isAppError ? (err as AppError).statusCode : 500;
  const code = isAppError ? (err as AppError).code : "INTERNAL_ERROR";
  const message =
    isAppError || process.env.NODE_ENV === "production"
      ? err.message
      : err.message;

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}
