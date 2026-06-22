import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import memoryRoutes from "./routes/memory.js";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/memory", memoryRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown handler
function shutdown(signal: string): void {
  // eslint-disable-next-line no-console
  logger.info(${signal} received. Shutting down gracefully...`);
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

const port = config.port;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  logger.info(REZ Memory Engine listening on port ${port}`);
  // eslint-disable-next-line no-console
  logger.info(Environment: ${config.nodeEnv}`);
});

export default app;