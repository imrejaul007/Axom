import type { Request, Response, NextFunction } from "express";
/**
 * Express error handler middleware.
 *
 * Catches operational errors, Zod validation failures, and unexpected
 * exceptions, then sends a consistent JSON response.
 */
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
/**
 * Error class for not-found resources.
 */
export declare class NotFoundError extends Error {
    constructor(resource: string, id: string);
}
//# sourceMappingURL=errorHandler.d.ts.map