/**
 * REZ Life Pattern Engine - Request Logger Middleware
 * Logs incoming requests and response times
 */
import { Request, Response, NextFunction } from "express";
/**
 * Request logger middleware
 * Logs incoming requests and response times
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Logs an info message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export declare function logInfo(message: string, meta?: Record<string, unknown>): void;
/**
 * Logs a warning message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export declare function logWarn(message: string, meta?: Record<string, unknown>): void;
/**
 * Logs an error message
 * @param message - Log message
 * @param meta - Additional metadata
 */
export declare function logError(message: string, meta?: Record<string, unknown>): void;
/**
 * Logs a debug message (only in development)
 * @param message - Log message
 * @param meta - Additional metadata
 */
export declare function logDebug(message: string, meta?: Record<string, unknown>): void;
//# sourceMappingURL=requestLogger.d.ts.map