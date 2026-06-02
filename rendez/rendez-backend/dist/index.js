"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telemetry_1 = require("./config/telemetry");
const redis_1 = require("./config/redis");
// Sentry — initialise before everything else so it captures startup errors.
// Only active when SENTRY_DSN is set; no-ops in dev/test.
if (process.env.SENTRY_DSN) {
    // Dynamic require so the package is optional during development
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        tracesSampleRate: 0.1,
    });
}
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const auth_1 = __importDefault(require("./routes/auth"));
const oauth_1 = __importDefault(require("./routes/oauth"));
const profile_1 = __importDefault(require("./routes/profile"));
const discover_1 = __importDefault(require("./routes/discover"));
const match_1 = __importDefault(require("./routes/match"));
const messaging_1 = __importDefault(require("./routes/messaging"));
const gift_1 = __importDefault(require("./routes/gift"));
const meetup_1 = __importDefault(require("./routes/meetup"));
const meetups_1 = __importDefault(require("./routes/meetups"));
const safety_1 = __importDefault(require("./routes/safety"));
const rez_1 = __importDefault(require("./routes/webhooks/rez"));
const upload_1 = __importDefault(require("./routes/upload"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const admin_1 = __importDefault(require("./routes/admin"));
const devices_1 = __importDefault(require("./routes/devices"));
const plans_1 = __importDefault(require("./routes/plans"));
const plans_v2_1 = __importDefault(require("./routes/plans-v2"));
const karma_1 = __importDefault(require("./routes/karma"));
const requests_1 = __importDefault(require("./routes/requests"));
const referral_1 = __importDefault(require("./routes/referral"));
const experienceCredits_1 = __importDefault(require("./routes/experienceCredits"));
const matches_1 = __importDefault(require("./routes/matches"));
const users_1 = __importDefault(require("./routes/users"));
const adminAuth_1 = require("./middleware/adminAuth");
const socketServer_1 = require("./realtime/socketServer");
const queue_1 = require("./jobs/queue");
// import './workers/planWorkers'; // registers plan BullMQ workers
// import './workers/trustDecayWorker'; // daily shadowScore decay + responseRate nudge
// import './workers/giftExpiryWorker'; // expires pending gifts after TTL
// import './workers/matchExpiryWorker'; // expires unresponded matches
// import './workers/catalogCacheWorker'; // refreshes Rendez catalog cache
// import './workers/rewardTriggerWorker'; // RZ-B-H3: meetup reward triggers with retries
// import './workers/sponsorCreditWorker'; // BULLETPROOF: sponsor coin credit retry with DLQ
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.NODE_ENV === 'production' ? 'https://rendez.in' : '*' }));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)(env_1.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
// Capture rawBody so webhookVerify.ts can use the exact bytes for HMAC validation.
// Re-serializing req.body after JSON.parse breaks HMAC for non-ASCII payloads.
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString('utf8');
    },
}));
app.use(rateLimiter_1.defaultLimiter);
// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'rendez-backend' }));
// Socket.io / Redis adapter health check
app.get('/health/socket', async (_req, res) => {
    try {
        const redisOk = (await redis_1.redis.ping()) === 'PONG';
        res.json({ status: 'ok', redis: redisOk, timestamp: new Date().toISOString() });
    }
    catch {
        res.status(503).json({ status: 'degraded', redis: false, timestamp: new Date().toISOString() });
    }
});
// Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/auth/oauth', oauth_1.default);
app.use('/api/v1/profile', profile_1.default);
app.use('/api/v1/discover', discover_1.default);
app.use('/api/v1/matches', match_1.default);
app.use('/api/v1/matches', messaging_1.default);
app.use('/api/v1/gifts', gift_1.default);
app.use('/api/v1/meetup', meetup_1.default);
app.use('/api/v1/meetups', meetups_1.default);
app.use('/api/v1', safety_1.default);
app.use('/api/v1/upload', upload_1.default);
app.use('/api/v1/wallet', wallet_1.default);
app.use('/admin', adminAuth_1.adminAuth, admin_1.default);
app.use('/api/v1/devices', devices_1.default);
app.use('/api/v1/plans', plans_1.default);
app.use('/api/v2/plans', plans_v2_1.default); // New Plans V2 API
app.use('/api/v1/karma', karma_1.default); // Karma API
app.use('/api/v1/requests', requests_1.default);
app.use('/api/v1/referral', referral_1.default);
app.use('/api/v1/experience-credits', experienceCredits_1.default);
app.use('/api/v1/plan-matches', matches_1.default);
app.use('/api/v1/users', users_1.default);
app.use('/webhooks/rez', rez_1.default);
app.use(errorHandler_1.errorHandler);
// Wrap express in an http.Server so Socket.io can share the port
const httpServer = http_1.default.createServer(app);
const io = (0, socketServer_1.attachSocketServer)(httpServer);
// Expose io instance for use in route handlers and services
app.set('io', io);
httpServer.listen(env_1.env.PORT, async () => {
    telemetry_1.log.info({ port: env_1.env.PORT }, '[Rendez] Backend running (HTTP + WS)');
    await (0, queue_1.startRecurringJobs)();
    telemetry_1.log.info('[Rendez] Background workers started');
});
exports.default = app;
