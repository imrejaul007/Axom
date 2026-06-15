import { z } from "zod";
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
export function validateRequest(schema, source = "body") {
    return (req, res, next) => {
        try {
            const data = schema.parse(req[source]);
            req.validated = data;
            next();
        }
        catch (err) {
            if (err instanceof z.ZodError) {
                res.status(400).json({
                    error: "Validation Error",
                    details: err.errors.map((e) => ({
                        field: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validateRequest.js.map