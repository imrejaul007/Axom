import type { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware.
 *
 * Logs HTTP method, path, status, response time, and user agent
 * for every incoming request.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log: Record<string, unknown> = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    };

    if ((req as unknown as Record<string, unknown>).userId) {
      log.userId = (req as unknown as Record<string, unknown>).userId;
    }

    if (res.statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ level: "error", ...log }));
    } else {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ level: "info", ...log }));
    }
  });

  next();
}
