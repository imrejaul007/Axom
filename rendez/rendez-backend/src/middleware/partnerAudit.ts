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
import { log as auditLog } from '../config/telemetry';

interface AuditEntry {
  ts: string;
  userId?: string;
  rezUserId?: string;
  capability: string;
  method: string;
  path: string;
  ip: string;
  status?: number;
}

function log(entry: AuditEntry) {
  // In production: ship to structured log (Datadog, Loki, etc.)
  auditLog.info({ entry }, '[AUDIT]');
}

/**
 * Attach audit logging to any route that calls REZ partner API.
 * Usage: router.post('/gifts/send', rendezAuth, auditPartnerCall('wallet.hold'), ...)
 */
export function auditPartnerCall(capability: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      userId: req.user?.id,
      rezUserId: req.user?.rezUserId,
      capability,
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
    };

    // Log on response finish so we capture status
    res.on('finish', () => {
      entry.status = res.statusCode;
      log(entry);
    });

    next();
  };
}

/**
 * Log all inbound webhook events from REZ.
 */
export function auditWebhook(event: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      capability: `webhook.${event}`,
      method: req.method,
      path: req.path,
      ip: req.ip || 'unknown',
    };
    res.on('finish', () => { entry.status = res.statusCode; log(entry); });
    next();
  };
}
