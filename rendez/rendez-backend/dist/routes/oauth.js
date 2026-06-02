"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const REZ_AUTH_URL = process.env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const REZ_CLIENT_ID = process.env.REZ_OAUTH_CLIENT_ID || 'rendez-app';
const REZ_CLIENT_SECRET = process.env.REZ_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.REZ_OAUTH_REDIRECT_URI || 'http://localhost:4000/api/auth/oauth/callback';
const OAUTH_STATE_TTL = 10 * 60; // 10 minutes
/**
 * GET /api/auth/oauth/authorize
 * Redirects user to REZ auth for OAuth login
 */
router.get('/authorize', (req, res) => {
    if (!REZ_CLIENT_SECRET) {
        res.status(503).json({ error: 'OAuth not configured: REZ_OAUTH_CLIENT_SECRET is not set' });
        return;
    }
    const state = crypto_1.default.randomBytes(16).toString('hex');
    const scope = 'profile wallet:read wallet:hold';
    // RD-CRIT-FIX: Store OAuth state in Redis instead of a global Map.
    // Global Map breaks in multi-instance deployments (each instance has its own memory).
    // Redis ensures all instances share the same state store.
    redis_1.redis.set(`oauth:state:${state}`, Date.now().toString(), 'EX', OAUTH_STATE_TTL);
    const params = new URLSearchParams({
        client_id: REZ_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope,
        state,
    });
    const authUrl = `${REZ_AUTH_URL}/oauth/authorize?${params.toString()}`;
    console.log(`[OAuth] Redirecting to: ${authUrl}`);
    res.redirect(authUrl);
});
/**
 * GET /api/auth/oauth/callback
 * Handles OAuth callback from REZ Auth Service
 */
router.get('/callback', async (req, res, next) => {
    try {
        const { code, state, error } = req.query;
        if (error) {
            console.error('[OAuth] OAuth error received from REZ partner');
            return res.redirect('/?oauth_error=' + encodeURIComponent(error));
        }
        if (!code || !state) {
            return res.status(400).json({ error: 'Missing code or state' });
        }
        // RD-CRIT-FIX: Validate state from Redis (CSRF protection).
        // Redis key has built-in TTL expiration — no manual timestamp comparison needed.
        const storedState = await redis_1.redis.get(`oauth:state:${state}`);
        if (!storedState) {
            return res.status(400).json({ error: 'Invalid or expired state' });
        }
        await redis_1.redis.del(`oauth:state:${state}`);
        // Exchange code for tokens
        const tokenResponse = await fetch(`${REZ_AUTH_URL}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: REZ_CLIENT_ID,
                client_secret: REZ_CLIENT_SECRET,
            }),
        });
        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            console.error('[OAuth] Token exchange with REZ partner failed');
            return res.status(400).json({ error: 'Token exchange failed' });
        }
        const tokens = await tokenResponse.json();
        // Get user info from REZ
        const userInfoResponse = await fetch(`${REZ_AUTH_URL}/oauth/userinfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (!userInfoResponse.ok) {
            return res.status(400).json({ error: 'Failed to get user info' });
        }
        const userInfo = await userInfoResponse.json();
        // Find or create Rendez user linked to REZ user
        let profile = await database_1.prisma.profile.findUnique({
            where: { rezUserId: userInfo.sub },
        });
        if (!profile) {
            // Create new Rendez profile linked to REZ user.
            // Note: createdAt/updatedAt are handled by Prisma's @default(now()).
            // age, gender, city are required fields — use placeholder defaults that the
            // user must fill in their profile settings. The REZ OAuth flow does not
            // provide these fields.
            profile = await database_1.prisma.profile.create({
                data: {
                    rezUserId: userInfo.sub,
                    name: userInfo.name || 'REZ User',
                    phone: userInfo.phone,
                    age: 25, // placeholder — user must set in profile
                    gender: 'MALE', // placeholder — user must set in profile
                    city: 'Unknown', // placeholder — user must set in profile
                    photos: [],
                },
            });
            console.log(`[OAuth] Created new profile for REZ user: ${userInfo.sub}`);
        }
        // Issue Rendez JWT token
        const rendezToken = (0, auth_1.issueRendezToken)(profile.id, profile.rezUserId);
        // Store tokens in session or return to client
        res.redirect(`/api/auth/oauth/success?token=${rendezToken}&profile_id=${profile.id}`);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/auth/oauth/success
 * Final success redirect with token
 */
router.get('/success', (req, res) => {
    const { token, profile_id } = req.query;
    if (!token) {
        return res.status(400).json({ error: 'No token' });
    }
    // In a real app, you'd set an HTTP-only cookie here
    // For mobile app, return JSON
    res.json({
        success: true,
        token,
        profile_id,
        message: 'OAuth login successful',
    });
});
/**
 * POST /api/auth/oauth/refresh
 * Refresh OAuth tokens
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        const tokenResponse = await fetch(`${REZ_AUTH_URL}/oauth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token,
                client_id: REZ_CLIENT_ID,
                client_secret: REZ_CLIENT_SECRET,
            }),
        });
        if (!tokenResponse.ok) {
            return res.status(401).json({ error: 'Token refresh failed' });
        }
        const tokens = await tokenResponse.json();
        res.json(tokens);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/auth/oauth/logout
 * Logout and revoke OAuth tokens
 */
router.post('/logout', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (token) {
            await fetch(`${REZ_AUTH_URL}/oauth/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    client_id: REZ_CLIENT_ID,
                    client_secret: REZ_CLIENT_SECRET,
                }),
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
