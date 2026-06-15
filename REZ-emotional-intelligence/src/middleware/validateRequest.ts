import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

/**
 * Middleware factory that validates request body against a Zod schema.
 * @template T
 * @param {ZodSchema<T>} schema - The Zod schema to validate against
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Express middleware
 */
export function validateRequest<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AppError(
          `Validation failed: ${err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        );
      }
      throw err;
    }
  };
}

/**
 * Middleware factory that validates request query parameters against a Zod schema.
 * @template T
 * @param {ZodSchema<T>} schema - The Zod schema to validate against
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Express middleware
 */
export function validateQuery<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      // Cast through unknown to bypass Express's strict ParsedQs type
      (req as unknown as { query: T }).query = parsed;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new AppError(
          `Query validation failed: ${err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          400
        );
      }
      throw err;
    }
  };
}
