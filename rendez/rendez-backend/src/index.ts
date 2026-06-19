import 'dotenv/config';
import { log } from './config/telemetry';
import { redis } from './config/redis';

// Sentry — initialise before everything else so it captures startup errors.
// Only active when SENTRY_DSN is set; no-ops in dev/test.
if (process.env.SENTRY_DSN) {
  // Dynamic require so the package is optional during development
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sentry = require('@sentry/node') as typeof import('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  });
}

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env';
import { RawBodyRequest } from './types/express';
import { errorHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import profileRoutes from './routes/profile';
import discoverRoutes from './routes/discover';
import matchRoutes from './routes/match';
import messagingRoutes from './routes/messaging';
import giftRoutes from './routes/gift';
import meetupRoutes from './routes/meetup';
import safetyRoutes from './routes/safety';
import rezWebhooks from './routes/webhooks/rez';
import uploadRoutes from './routes/upload';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import deviceRoutes from './routes/devices';
import planRoutes from './routes/plans';
import requestRoutes from './routes/requests';
import referralRoutes from './routes/referral';
import experienceCreditRoutes from './routes/experienceCredits';
import { adminAuth } from './middleware/adminAuth';

import { attachSocketServer } from './realtime/socketServer';
import { startRecurringJobs } from './jobs/queue';
import './workers/planWorkers'; // registers plan BullMQ workers
import './workers/trustDecayWorker'; // daily shadowScore decay + responseRate nudge
import './workers/giftExpiryWorker'; // expires pending gifts after TTL
import './workers/matchExpiryWorker'; // expires unresponded matches
import './workers/catalogCacheWorker'; // refreshes Rendez catalog cache
import './workers/rewardTriggerWorker'; // RZ-B-H3: meetup reward triggers with retries
import './workers/sponsorCreditWorker'; // BULLETPROOF: sponsor coin credit retry with DLQ

const app = express();

app.use(helmet());
app.use(cors({ origin: env.NODE_ENV === 'production' ? 'https://rendez.in' : '*' }));
app.use(compression());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
// Capture rawBody so webhookVerify.ts can use the exact bytes for HMAC validation.
// Re-serializing req.body after JSON.parse breaks HMAC for non-ASCII payloads.
app.use(express.json({
  verify: (req: RawBodyRequest, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));
app.use(defaultLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'rendez-backend' }));

// Socket.io / Redis adapter health check
app.get('/health/socket', async (_req, res) => {
  try {
    const redisOk = (await redis.ping()) === 'PONG';
    res.json({ status: 'ok', redis: redisOk, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', redis: false, timestamp: new Date().toISOString() });
  }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/discover', discoverRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/matches', messagingRoutes);
app.use('/api/v1/gifts', giftRoutes);
app.use('/api/v1/meetup', meetupRoutes);
app.use('/api/v1', safetyRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/admin', adminAuth, adminRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/referral', referralRoutes);
app.use('/api/v1/experience-credits', experienceCreditRoutes);
app.use('/webhooks/rez', rezWebhooks);

app.use(errorHandler);

// Wrap express in an http.Server so Socket.io can share the port
const httpServer = http.createServer(app);
attachSocketServer(httpServer);

httpServer.listen(env.PORT, async () => {
  log.info({ port: env.PORT }, '[Rendez] Backend running (HTTP + WS)');
  await startRecurringJobs();
  log.info('[Rendez] Background workers started');
});

export default app;
