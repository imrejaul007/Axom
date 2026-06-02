import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        rezUserId: string;
        phone: string;
    };
}
export declare function rezAuth(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function rendezAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function issueRendezToken(profileId: string, rezUserId: string): string;
/**
 * H-3 FIX: Type guard that asserts req.user is present.
 * Use this instead of non-null assertion (!) when you need a clean error path
 * rather than relying on TypeScript to trust the middleware chain.
 *
 * Usage: const user = requireUser(req, res); if (!user) return;
 */
export declare function requireUser(req: AuthRequest, res: import('express').Response): Required<AuthRequest>['user'] | null;
//# sourceMappingURL=auth.d.ts.map