/**
 * REZ Life Pattern Engine - Request Validation Middleware
 * Validates incoming requests using Zod schemas
 */
import { ZodError } from "zod";
/**
 * Creates a validation middleware for request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.body);
            req.body = validated;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Validation Error",
                    details: error.errors.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Creates a validation middleware for URL parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Invalid URL Parameters",
                    details: error.errors.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Creates a validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: "Invalid Query Parameters",
                    details: error.errors.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Common validation schemas for reuse
 */
/**
 * UUID validation schema for URL parameters
 */
export const uuidParamSchema = {
    id: (fieldName = "id") => ({ [fieldName]: () => ({ type: "string", coerce: true }) }),
};
/**
 * Pagination query schema
 */
export const paginationQuerySchema = z.object({
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
});
/**
 * Date range query schema
 */
export const dateRangeQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    days: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});
// Need to import zod here since we use it directly
import { z } from "zod";
/**
 * Combines multiple validation middlewares
 * @param middlewares - Array of validation middlewares
 * @returns Combined middleware function
 */
export function combineValidation(...middlewares) {
    return (req, res, next) => {
        let index = 0;
        const nextMiddleware = () => {
            if (index < middlewares.length) {
                const middleware = middlewares[index];
                index++;
                middleware(req, res, nextMiddleware);
            }
            else {
                next();
            }
        };
        nextMiddleware();
    };
}
//# sourceMappingURL=validateRequest.js.map