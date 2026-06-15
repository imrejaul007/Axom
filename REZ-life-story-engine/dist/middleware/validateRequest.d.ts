/**
 * Request validation middleware using Zod
 * @module middleware/validateRequest
 */
import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export declare function validateBody(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validates request params against a Zod schema
 * @param schema - Zod schema to validate against
 */
export declare function validateParams(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validates request query against a Zod schema
 * @param schema - Zod schema to validate against
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map