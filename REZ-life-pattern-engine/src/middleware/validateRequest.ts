/**
 * REZ Life Pattern Engine - Request Validation Middleware
 * Validates incoming requests using Zod schemas
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

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
export function validateBody<T>(
  schema: ZodSchema<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
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
export function validateParams<T>(
  schema: ZodSchema<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
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
export function validateQuery<T>(
  schema: ZodSchema<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
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
  id: (fieldName: string = "id") =>
    ({ [fieldName]: () => ({ type: "string", coerce: true } as const) }),
} as const;

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
export function combineValidation(
  ...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;

    const nextMiddleware = (): void => {
      if (index < middlewares.length) {
        const middleware = middlewares[index]!;
        index++;
        middleware(req, res, nextMiddleware);
      } else {
        next();
      }
    };

    nextMiddleware();
  };
}
