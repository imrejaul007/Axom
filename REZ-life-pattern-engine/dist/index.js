/**
 * REZ Life Pattern Engine - Application Entry Point
 * Express server setup and configuration
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config.js";
import { createPatternRouter } from "./routes/pattern.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
/**
 * Creates and configures the Express application
 * @returns Configured Express app
 */
function createApp() {
    const app = express();
    // Security middleware
    app.use(helmet());
    // CORS configuration
    app.use(cors({
        origin: config.isProduction
            ? process.env.ALLOWED_ORIGINS?.split(",") ?? "*"
            : "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
        credentials: true,
    }));
    // Compression
    app.use(compression());
    // Body parsing
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    // Request logging
    app.use(requestLogger);
    // Health check endpoint
    app.get("/health", (_req, res) => {
        res.json({
            status: "healthy",
            service: "rez-life-pattern-engine",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        });
    });
    // Readiness check
    app.get("/ready", (_req, res) => {
        res.json({
            status: "ready",
            timestamp: new Date().toISOString(),
        });
    });
    // API routes
    app.use("/api/pattern", createPatternRouter());
    // 404 handler for unmatched routes
    app.use(notFoundHandler);
    // Global error handler
    app.use(errorHandler);
    return app;
}
/**
 * Starts the server
 */
async function startServer() {
    const app = createApp();
    const server = app.listen(config.port, () => {
        logger.info(
╔════════════════════════════════════════════════════════════╗
║         REZ Life Pattern Engine                          ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.nodeEnv.padEnd(42)}║
║  Port:        ${String(config.port).padEnd(42)}║
║  Health:      http://localhost:${config.port}/health           ║
║  API Base:    http://localhost:${config.port}/api/pattern       ║
╚════════════════════════════════════════════════════════════╝
    `);
    });
    // Graceful shutdown handling
    const shutdown = async (signal) => {
        logger.info(\n[SHUTDOWN] Received ${signal}. Shutting down gracefully...`);
        server.close(() => {
            console.log("[SHUTDOWN] HTTP server closed");
            process.exit(0);
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error("[SHUTDOWN] Forced shutdown after timeout");
            process.exit(1);
        }, 10000);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        console.error("[UNCAUGHT] Uncaught exception:", error);
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
        console.error("[UNHANDLED] Unhandled rejection at:", promise, "reason:", reason);
    });
}
// Start the server
startServer().catch((error) => {
    console.error("[STARTUP] Failed to start server:", error);
    process.exit(1);
});
// Export app for testing
export { createApp };
//# sourceMappingURL=index.js.map