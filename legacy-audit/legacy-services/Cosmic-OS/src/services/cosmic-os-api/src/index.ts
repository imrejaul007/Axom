import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4070;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Cosmic OS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API status endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    os: 'Cosmic OS',
    status: 'active',
    uptime: process.uptime(),
    features: [
      'app-launcher',
      'settings',
      'notifications',
      'theming',
      'system-monitor',
    ],
    environment: NODE_ENV,
  });
});

// System info endpoint
app.get('/api/system', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  res.json({
    platform: process.platform,
    nodeVersion: process.version,
    pid: process.pid,
    memory: {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
    },
    cpuUsage: process.cpuUsage(),
  });
});

// App registry endpoint
app.get('/api/apps', (_req: Request, res: Response) => {
  res.json({
    apps: [
      { id: 'launcher', name: 'App Launcher', icon: 'rocket', status: 'active' },
      { id: 'settings', name: 'Settings', icon: 'gear', status: 'active' },
      { id: 'status', name: 'System Status', icon: 'monitor', status: 'active' },
    ],
    total: 3,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: _req.path,
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   ✨ COSMIC OS API ✨                        ║
  ║                                              ║
  ║   Server running on port ${PORT}               ║
  ║   Environment: ${NODE_ENV.padEnd(27)}║
  ║   Mode: ES Modules                           ║
  ║                                              ║
  ║   Endpoints:                                 ║
  ║   - GET /health                              ║
  ║   - GET /api/status                          ║
  ║   - GET /api/system                          ║
  ║   - GET /api/apps                            ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});

export default app;