/**
 * Request validation middleware using Zod
 * @module middleware/validateRequest
 */
import { ZodError } from 'zod';
/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                next(error);
            }
            else {
                next(new Error('Validation failed'));
            }
        }
    };
}
/**
 * Validates request params against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateParams(schema) {
    return (req, _res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                next(error);
            }
            else {
                next(new Error('Parameter validation failed'));
            }
        }
    };
}
/**
 * Validates request query against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                next(error);
            }
            else {
                next(new Error('Query validation failed'));
            }
        }
    };
}
//# sourceMappingURL=validateRequest.js.map