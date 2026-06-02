/**
 * Partner API Audit Middleware
 *
 * REZ Internal Auth Audit (2026-04-08) identified:
 *  - Single shared token has too much blast radius
 *  - Inconsistent status codes across services
 *  - Missing structured audit logging on mutation routes
 *
 * This middleware addresses item 3 for Rendez → REZ outbound calls:
 * all outbound partner API calls are logged with capability, intent, and
 * timestamp so post-incident investigation is traceable.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
/**
 * Attach audit logging to any route that calls REZ partner API.
 * Usage: router.post('/gifts/send', rendezAuth, auditPartnerCall('wallet.hold'), ...)
 */
export declare function auditPartnerCall(capability: string): (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Log all inbound webhook events from REZ.
 */
export declare function auditWebhook(event: string): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=partnerAudit.d.ts.map