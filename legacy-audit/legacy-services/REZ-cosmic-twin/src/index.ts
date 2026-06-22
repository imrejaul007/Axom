import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config.js";
import { errorHandler, requestLogger } from "./middleware/index.js";
import twinRouter from "./routes/cosmicTwin.js";

const app = express();

// Security and performance middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Parse JSON bodies
app.use(express.json());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "@axom/rez-cosmic-twin",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/twin", twinRouter);

// 404 handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  });
});

// Global error handler
app.use(errorHandler);

// Start server only when this file is run directly (not imported)
const server = app.listen(config.PORT, () => {
  console.log(
    `REZ Cosmic Twin listening on port ${config.PORT} [${config.NODE_ENV}]`
  );
});

export { app, server };
