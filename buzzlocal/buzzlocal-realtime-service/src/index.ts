import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { redisClient } from './utils/redis.js';
import { chatService } from './services/chatService.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxRequests, message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } } });
app.use('/api/', limiter);

app.get('/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isReady() ? 'connected' : 'disconnected';
  res.json({ status: mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'degraded', version: '1.0.0', uptime: process.uptime(), connections: chatService.getConnectionCount(), dependencies: { mongodb: mongoStatus, redis: redisStatus } });
});

app.get('/api/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const { limit = '50', offset = '0' } = req.query;
  const messages = await chatService.getMessages(conversationId, parseInt(limit as string, 10), parseInt(offset as string, 10));
  res.json({ success: true, data: { messages } });
});

app.get('/api/conversations/:userId', async (req, res) => {
  const { userId } = req.params;
  const conversations = await chatService.getConversations(userId);
  res.json({ success: true, data: { conversations } });
});

app.use((req, res) => { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } }); });
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => { logger.error('Unhandled error', { error: err.message }); res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An internal server error occurred' } }); });

async function connectDatabase(): Promise<void> { try { await mongoose.connect(config.mongodb.uri); logger.info('MongoDB connected successfully'); } catch (error) { logger.error('MongoDB connection failed', { error }); throw error; } }
async function connectRedis(): Promise<void> { try { await redisClient.connect(); } catch (error) { logger.warn('Redis connection failed, continuing without cache', { error }); } }

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  try { await mongoose.connection.close(); } catch (e) { logger.error('Error closing MongoDB', { e }); }
  try { await redisClient.disconnect(); } catch (e) { logger.error('Error closing Redis', { e }); }
  process.exit(0);
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await connectRedis();

    const httpServer = createServer(app);
    chatService.initialize(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`BuzzLocal Realtime Service started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) { logger.error('Failed to start server', { error }); process.exit(1); }
}

startServer();
export default app;