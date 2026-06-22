/**
 * REZ Trust OS - Validation Middleware
 * @module middleware/validateRequest
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateRequest(schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as typeof req.params;
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            issues: error.errors,
          },
        });
        return;
      }
      next(error);
    }
  };
}