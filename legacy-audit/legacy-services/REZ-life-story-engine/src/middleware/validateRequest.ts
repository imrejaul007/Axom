/**
 * Request validation middleware using Zod
 * @module middleware/validateRequest
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new Error('Validation failed'));
      }
    }
  };
}

/**
 * Validates request params against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new Error('Parameter validation failed'));
      }
    }
  };
}

/**
 * Validates request query against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(new Error('Query validation failed'));
      }
    }
  };
}