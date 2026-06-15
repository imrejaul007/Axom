import { ZodError } from "zod";
/**
 * Express error handler middleware.
 *
 * Catches operational errors, Zod validation failures, and unexpected
 * exceptions, then sends a consistent JSON response.
 */
export function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: "Validation Error",
            details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
        });
        return;
    }
    const statusCode = err.name === "NotFoundError" ? 404 : 500;
    res.status(statusCode).json({
        error: err.message || "Internal Server Error",
    });
}
/**
 * Error class for not-found resources.
 */
export class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`);
        this.name = "NotFoundError";
    }
}
//# sourceMappingURL=errorHandler.js.map