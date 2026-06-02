"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rezAuth = rezAuth;
exports.rendezAuth = rendezAuth;
exports.issueRendezToken = issueRendezToken;
exports.requireUser = requireUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const rezAuthClient_1 = require("../integrations/rez/rezAuthClient");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const telemetry_1 = require("../config/telemetry");
// Verify REZ JWT on first login, issue Rendez JWT
async function rezAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
            ? authHeader.slice(7)
            : undefined;
        if (!token)
            return res.status(401).json({ message: 'No token provided' });
        const rezResult = await (0, rezAuthClient_1.verifyRezToken)(token);
        if (!rezResult.valid)
            return res.status(401).json({ message: 'Invalid REZ token' });
        if (rezResult.verified_status !== 'verified') {
            return res.status(403).json({ message: 'REZ account not verified' });
        }
        // Check if the REZ account is suspended
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: rezResult.rez_user_id },
            select: { isSuspended: true },
        });
        if (profile?.isSuspended) {
            return res.status(403).json({ message: 'ACCOUNT_SUSPENDED. Your account has been suspended. Contact support.' });
        }
        req.user = {
            id: rezResult.rez_user_id,
            rezUserId: rezResult.rez_user_id,
            phone: rezResult.phone,
        };
        return next();
    }
    catch (err) {
        // RENDEZ-P1 FIX: Auth failures must always return 401. Returning 503 in production
        // incorrectly signals a temporary infrastructure issue rather than a credential problem,
        // which can cause clients to retry and potentially expose the endpoint to abuse.
        telemetry_1.log.warn({ err }, '[AUTH] REZ token verify failed or Redis unavailable — denying request');
        res.status(401).json({ message: 'Authentication failed' });
    }
}
// Verify Rendez JWT (for subsequent requests)
async function rendezAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
            ? authHeader.slice(7)
            : undefined;
        if (!token)
            return res.status(401).json({ message: 'No token provided' });
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: payload.sub, isActive: true },
            select: { id: true, rezUserId: true, phone: true, isSuspended: true },
        });
        if (!profile)
            return res.status(401).json({ message: 'Profile not found' });
        // RZ-B-H7 FIX: isSuspended is a non-optional Boolean field on the Profile model.
        // The unnecessary type cast weakened type safety. Use the field directly.
        if (profile.isSuspended) {
            return res.status(403).json({ message: 'ACCOUNT_SUSPENDED. Your account has been suspended. Contact support.' });
        }
        req.user = { id: profile.id, rezUserId: profile.rezUserId, phone: profile.phone };
        next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ message: 'TOKEN_EXPIRED. Token has expired — please log in again' });
        }
        res.status(401).json({ message: 'INVALID_TOKEN. Invalid token' });
    }
}
function issueRendezToken(profileId, rezUserId) {
    return jsonwebtoken_1.default.sign({ sub: profileId, rezUserId }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
}
/**
 * H-3 FIX: Type guard that asserts req.user is present.
 * Use this instead of non-null assertion (!) when you need a clean error path
 * rather than relying on TypeScript to trust the middleware chain.
 *
 * Usage: const user = requireUser(req, res); if (!user) return;
 */
function requireUser(req, res) {
    if (!req.user) {
        res.status(401).json({ message: 'AUTH_REQUIRED. Authentication required' });
        return null;
    }
    return req.user;
}
