import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=errorHandler.d.ts.map