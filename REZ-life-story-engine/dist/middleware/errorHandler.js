/**
 * Global error handling middleware
 * @module middleware/errorHandler
 */
import { ZodError } from 'zod';
/**
 * Custom error class with status code
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Not found error
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}
/**
 * Validation error
 */
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
/**
 * Global error handler middleware
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param _next - Next function
 */
export function errorHandler(err, _req, res, _next) {
    // Log error for debugging
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
    });
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle custom AppError
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }
    // Handle unknown errors
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
}
/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map