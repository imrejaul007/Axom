"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditPartnerCall = auditPartnerCall;
exports.auditWebhook = auditWebhook;
const telemetry_1 = require("../config/telemetry");
function log(entry) {
    // In production: ship to structured log (Datadog, Loki, etc.)
    telemetry_1.log.info({ entry }, '[AUDIT]');
}
/**
 * Attach audit logging to any route that calls REZ partner API.
 * Usage: router.post('/gifts/send', rendezAuth, auditPartnerCall('wallet.hold'), ...)
 */
function auditPartnerCall(capability) {
    return (req, res, next) => {
        const entry = {
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
function auditWebhook(event) {
    return (req, res, next) => {
        const entry = {
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
