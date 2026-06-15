import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
/**
 * Zod validation middleware factory.
 *
 * Validates request body, query, or params against a Zod schema.
 * Attaches parsed data to `req.validated` and sends a 400 response
 * if validation fails.
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate (body, query, params)
 */
export declare function validateRequest<T>(schema: z.ZodSchema<T>, source?: "body" | "query" | "params"): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map