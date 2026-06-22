# CLAUDE.md - BuzzLocal Intelligence Service

## Service Overview

**Name:** buzzlocal-intelligence-service
**Company:** AXOM
**Parent:** HOJAI-AI
**Port:** 4010
**Status:** Complete

## What This Service Does

AI-powered content moderation and analysis service for BuzzLocal social platform. Provides:
- Content moderation (violence, hate speech, harassment detection)
- Sentiment analysis (positive/negative/neutral with emotion detection)
- Spam detection
- Toxicity detection
- Batch processing
- Analytics and statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                          │
│                     (Port 4010)                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AI Analysis  │   │    Routes     │   │    Health     │
│    Service    │   │  /api/analysis│   │   Check       │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   MongoDB     │   │    Redis      │   │    Logger     │
│   (Content    │   │   (Cache)     │   │   (Winston)   │
│   Analysis)   │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry point, Express server setup |
| `src/config.ts` | Configuration management |
| `src/types/index.ts` | TypeScript interfaces and Zod schemas |
| `src/models/contentAnalysis.ts` | Mongoose schema for content analysis |
| `src/services/aiAnalysisService.ts` | Core AI analysis logic |
| `src/routes/analysisRoutes.ts` | REST API endpoints |
| `src/utils/logger.ts` | Winston logger setup |
| `src/utils/redis.ts` | Redis client wrapper |

## Dependencies

| Package | Purpose |
|---------|---------|
| express | HTTP server |
| mongoose | MongoDB ODM |
| ioredis | Redis client |
| zod | Schema validation |
| helmet | Security headers |
| cors | CORS handling |
| compression | Response compression |
| winston | Logging |
| express-rate-limit | Rate limiting |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4010 | Service port |
| NODE_ENV | development | Environment |
| MONGODB_URI | mongodb://localhost:27017/buzzlocal-intelligence | MongoDB connection |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| SENTIMENT_THRESHOLD | 0.5 | Sentiment classification threshold |
| TOXICITY_THRESHOLD | 0.7 | Toxicity detection threshold |
| SPAM_THRESHOLD | 0.6 | Spam detection threshold |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analysis/analyze | Analyze single content |
| POST | /api/analysis/analyze/batch | Batch analyze multiple items |
| GET | /api/analysis/analysis/:contentId | Get analysis by content ID |
| GET | /api/analysis/analysis/user/:userId | Get user analysis history |
| GET | /api/analysis/stats/flagged | Get flagged content stats |
| GET | /api/analysis/stats/sentiment | Get sentiment distribution |
| GET | /health | Health check |

## Connected Services

| Service | Integration | Purpose |
|---------|-------------|---------|
| RABTUL Auth | API call | User authentication |
| RABTUL Wallet | API call | Karma points |
| buzzlocal-feed-service | Internal | Content for analysis |
| buzzlocal-community-service | Internal | Community moderation |
| HOJAI AI | Future | Advanced AI models |

## Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build
npm run build

# Start production
npm start

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Notes

- This service uses simulated AI analysis. In production, connect to HOJAI AI services for advanced models
- Redis caching reduces database load for repeated analysis requests
- All content is analyzed asynchronously for performance
- Flagged content triggers notifications via buzzlocal-notification-service