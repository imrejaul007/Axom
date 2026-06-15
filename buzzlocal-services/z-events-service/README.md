# Z Events Service

> **Other** | Company: Axom

## Overview

This is a Other service in the Axom ecosystem.

## Quick Start

```bash
npm install
npm run dev
```

**Default Port:** `4008`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4008 | Service port |
| NODE_ENV | No | development | Environment |
| MONGODB_URI | Yes | - | MongoDB connection |
| JWT_SECRET | Yes | - | JWT signing secret |
| REDIS_URL | No | redis://localhost:6379 | Redis |

## Tech Stack

- Node.js / Express
- TypeScript
- MongoDB
- Redis

## Integration Points

### RABTUL Services (Core)

| Service | Port | Purpose |
|---------|------|---------|
| RABTUL Auth | 4002 | Authentication |
| RABTUL Payment | 4001 | Payments |
| RABTUL Wallet | 4004 | Balance |
| RABTUL Notification | 4005 | Notifications |

## License

Proprietary - RTNM Digital

---

**Last Updated:** 2026-06-12
