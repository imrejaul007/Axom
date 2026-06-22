import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "./errorHandler.js";

/**
 * Creates middleware that validates request body/query/params against a Zod schema.
 *
 * @param schema - Zod schema to validate against.
 * @param source - Which part of the request to validate ("body", "query", "params").
 * @returns Express middleware that validates and either calls next() or returns an error.
 *
 * @example
 * const validateCreateTwin = validateRequest(
 *   z.object({ userId: z.string().uuid(), name: z.string().min(1) }),
 *   "body"
 * );
 */
export function validateRequest(
  schema: z.ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));

      next(
        new AppError(400, "Validation failed", "VALIDATION_ERROR")
      );
      return;
    }

    // Replace with validated data to ensure type safety downstream
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}
