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
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    console.log(log);
  });

  next();
}
