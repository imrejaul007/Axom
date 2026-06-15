/**
 * REZ Life Pattern Engine - Error Handler Middleware
 * Centralized error handling for Express routes
 */
import { Request, Response, NextFunction } from "express";
/**
 * Custom error class for API errors
 */
export declare class ApiError extends Error {
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
    constructor(message: string, statusCode?: number, isOperational?: boolean);
    /**
     * Creates a 400 Bad Request error
     * @param message - Error message
     * @returns ApiError instance
     */
    static badRequest(message: string): ApiError;
    /**
     * Creates a 404 Not Found error
     * @param message - Error message
     * @returns ApiError instance
     */
    static notFound(message: string): ApiError;
    /**
     * Creates a 500 Internal Server Error
     * @param message - Error message
     * @returns ApiError instance
     */
    static internal(message: string): ApiError;
}
/**
 * Global error handler middleware
 * Handles all errors thrown during request processing
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 * @returns Express request handler
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 404 handler for unmatched routes
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map