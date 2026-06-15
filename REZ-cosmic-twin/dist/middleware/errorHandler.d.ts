import { Request, Response, NextFunction } from "express";
/**
 * Application-level error class for typed error handling.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
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
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map