/**
 * REZ Life Story Engine - Main Application Entry Point
 * @module index
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import lifeStoryRoutes from './routes/lifeStory.js';
const app = express();
// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Request logging
app.use(requestLogger);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: '@axom/rez-life-story-engine',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
// API routes
app.use('/api/story', lifeStoryRoutes);
// Error handling
app.use(errorHandler);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});
// Start server
const { port } = config;
app.listen(port, () => {
    logger.info(
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   REZ Life Story Engine                                    ║
║   Version 1.0.0                                            ║
║                                                            ║
║   Server running on port ${port}                             ║
║   Environment: ${config.nodeEnv.padEnd(15)}                          ║
║                                                            ║
║   Endpoints:                                               ║
║   • GET  /health              Health check                 ║
║   • POST /api/story/generate  Generate story              ║
║   • GET  /api/story/:userId   Get user's story            ║
║   • GET  /api/story/:storyId/chapter/:chapterId  Get chapter
║   • POST /api/story/:userId/chapter   Add chapter         ║
║   • PUT  /api/story/:storyId/chapter/:chapterId  Update   ║
║   • DELETE /api/story/:storyId/chapter/:chapterId  Delete  ║
║   • GET  /api/story/:userId/themes   Get themes            ║
║   • GET  /api/story/:storyId/arc   Get arc                ║
║   • GET  /api/story/:userId/summary   Get summary          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
export default app;
//# sourceMappingURL=index.js.map