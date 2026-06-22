/**
 * Request validation middleware using Zod schemas.
 * @module middleware/validateRequest
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Creates middleware that validates request body against a Zod schema.
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Creates middleware that validates request params against a Zod schema.
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

/**
 * Creates middleware that validates request query against a Zod schema.
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(result.error);
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Formats Zod errors into a readable structure.
 * @param error - Zod error to format
 * @returns Formatted error array
 */
export function formatZodErrors(error: ZodError): { path: string; message: string }[] {
  return error.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message,
  }));
}
