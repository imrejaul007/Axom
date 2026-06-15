import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        phone: string;
    };
}
export { AuthRequest };
export declare function auth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function signToken(payload: {
    id: string;
    phone: string;
}): string;
//# sourceMappingURL=userAuth.d.ts.map