import { Request, Response, NextFunction } from "express";
import { z } from "zod";
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
export declare function validateRequest(schema: z.ZodSchema, source?: "body" | "query" | "params"): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map