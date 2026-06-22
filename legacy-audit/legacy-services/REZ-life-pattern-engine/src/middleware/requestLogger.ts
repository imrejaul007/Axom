/**
 * REZ Life Pattern Engine - Request Logger Middleware
 * Logs incoming requests and response times
 */

import { Request, Response, NextFunction } from "express";

/**
 * Request metadata for logging
 */
interface RequestLogData {
  /** Request method */
  method: string;
  /** Request path */
  path: string;
  /** Request query parameters */
  query: Record<string, unknown>;
  /** Request body (sanitized) */
  body?: Record<string, unknown>;
  /** Request timestamp */
  timestamp: Date;
  /** Unique request ID */
  requestId: string;
}

/**
 * Formats request body for logging (removes sensitive data)
 * @param body - Request body
 * @returns Sanitized body
 */
function sanitizeBody(
  body?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!body) return undefined;

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "credential",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generates a unique request ID
 * @returns Unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a log entry
 * @param level - Log level
 * @param data - Request log data
 * @param duration - Response duration in ms
 * @param statusCode - Response status code
 * @returns Formatted log string
 */
function formatLog(
  level: string,
  data: RequestLogData,
  duration?: number,
  statusCode?: number
): string {
  const parts = [
    `[${level}]`,
    data.requestId,
    data.method,
    data.path,
  ];

  if (duration !== undefined) {
    parts.push(`${duration}ms`);
  }

  if (statusCode !== undefined) {
    parts.push(`[${statusCode}]`);
  }

  return parts.join(" ");
}

/**
 * Request logger middleware
 * Logs incoming requests and response times
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate request ID
  const requestId = generateRequestId();
  req.headers["x-request-id"] = requestId as string;

  // Capture start time
  const startTime = Date.now();

  // Create log data
  const logData: RequestLogData = {
    method: req.method,
    path: req.path,
    query: req.query as Record<string, unknown>,
    body: sanitizeBody(req.body as Record<string, unknown>),
    timestamp: new Date(),
    requestId,
  };

  // Log incoming request
  console.log(formatLog("IN", logData));

  // Capture response finish using on-finished pattern
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  let responseFinished = false;

  const logResponse = (): void => {
    if (responseFinished) return;
    responseFinished = true;

    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Determine log level based on status code
    const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "OUT";

    console.log(formatLog(level, logData, duration, statusCode));
  };

  res.on("finish", logResponse);
  res.on("close", logResponse);

  next();
}

/**
 * Logs an info message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  console.log(
    `[INFO] ${new Date().toISOString()} ${message}`,
    meta ? JSON.stringify(meta) : ""
  );
}

/**
 * Logs a warning message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logWarn(message: string, meta?: Record<string, unknown>): void {
  console.warn(
    `[WARN] ${new Date().toISOString()} ${message}`,
    meta ? JSON.stringify(meta) : ""
  );
}

/**
 * Logs an error message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logError(message: string, meta?: Record<string, unknown>): void {
  console.error(
    `[ERROR] ${new Date().toISOString()} ${message}`,
    meta ? JSON.stringify(meta) : ""
  );
}

/**
 * Logs a debug message (only in development)
 * @param message - Log message
 * @param meta - Additional metadata
 */
export function logDebug(message: string, meta?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(
      `[DEBUG] ${new Date().toISOString()} ${message}`,
      meta ? JSON.stringify(meta) : ""
    );
  }
}