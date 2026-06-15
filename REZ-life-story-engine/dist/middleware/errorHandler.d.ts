/**
 * Global error handling middleware
 * @module middleware/errorHandler
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Custom error class with status code
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
/**
 * Not found error
 */
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
/**
 * Validation error
 */
export declare class ValidationError extends AppError {
    constructor(message: string);
}
/**
 * Global error handler middleware
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param _next - Next function
 */
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map