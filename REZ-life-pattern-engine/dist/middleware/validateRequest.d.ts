/**
 * REZ Life Pattern Engine - Request Validation Middleware
 * Validates incoming requests using Zod schemas
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
/**
 * Type for validated request with typed body
 */
export interface ValidatedRequest<T = Record<string, unknown>> extends Request {
    /** Validated and typed request body */
    validatedBody: T;
}
/**
 * Creates a validation middleware for request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Creates a validation middleware for URL parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Creates a validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Common validation schemas for reuse
 */
/**
 * UUID validation schema for URL parameters
 */
export declare const uuidParamSchema: {
    readonly id: (fieldName?: string) => {
        [x: string]: () => {
            readonly type: "string";
            readonly coerce: true;
        };
    };
};
/**
 * Pagination query schema
 */
export declare const paginationQuerySchema: z.ZodObject<{
    limit: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    offset: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: string | undefined;
    offset?: string | undefined;
}>;
/**
 * Date range query schema
 */
export declare const dateRangeQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    days: z.ZodEffects<z.ZodOptional<z.ZodString>, number | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    days?: number | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
    days?: string | undefined;
}>;
import { z } from "zod";
/**
 * Combines multiple validation middlewares
 * @param middlewares - Array of validation middlewares
 * @returns Combined middleware function
 */
export declare function combineValidation(...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map