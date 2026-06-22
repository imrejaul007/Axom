# CLAUDE.md - REZ Cosmic Twin

**Version:** 1.0.0
**Updated:** June 14, 2026
**Company:** Axom
**Port:** 4055

---

## PROJECT OVERVIEW

**Name:** REZ Cosmic Twin
**Type:** REZ Intelligence - Digital Twin Service
**Purpose:** Complete state representation of company/person/entity in real-time with cosmic context

## What is a Digital Twin?

A **digital twin** is a dynamic, evolving software representation of a person, entity, or system.
It mirrors the real-world counterpart's characteristics, behaviors, and interactions — enabling
personalization, prediction, and intelligent automation at scale.

REZ Cosmic Twin gives each user a living digital twin that:

- **Learns** from interaction data and behavioral patterns
- **Syncs** across the REZ ecosystem via Memory Engine and Trust OS
- **Evolves** through capability-based growth (recommendation, prediction, simulation, etc.)
- **Serves** personalized experiences to every downstream REZ service

---

## CAPABILITIES

| Capability | Description |
|------------|-------------|
| RECOMMENDATION | Suggests content, connections, and actions based on twin model |
| PREDICTION | Forecasts future behavior or preferences |
| PERSONALIZATION | Adapts experiences to the unique twin profile |
| ANALYSIS | Generates insights from accumulated data points |
| SIMULATION | Runs scenario modeling against the twin model |

---

## PROJECT STRUCTURE

```
REZ-cosmic-twin/
├── src/
│   └── index.ts              # Main entry point
├── test/                      # Unit tests
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── README.md
├── CLAUDE.md                 # This file
└── .env.example             # Environment template
```

---

## TECH STACK

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Auth:** JWT / Internal service token

---

## QUICK START

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

---

## COMMANDS

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm run test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

---

## ENVIRONMENT VARIABLES

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4055 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret |
| REDIS_URL | No | - | Redis connection URL |

---

## API ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/twin/create | Create a new digital twin |
| GET | /api/twin/:id | Get twin by ID |
| GET | /api/twin/user/:userId | Get twin by user ID |
| PUT | /api/twin/:id | Update twin properties |
| POST | /api/twin/:id/sync | Sync data to twin |
| POST | /api/twin/:id/capability | Add a capability |
| GET | /api/twin/:id/sync | Get sync history |
| GET | /api/twin/status/:status | Get twins by status |
| GET | /api/twin/:id/learning | Get learning progress |
| DELETE | /api/twin/:id | Delete a twin |

---

## INTEGRATION POINTS

### RABTUL Services

| Service | Port | Integration |
|---------|------|-------------|
| RABTUL Auth | 4002 | JWT validation, user verification |
| RABTUL Payment | 4001 | Payment processing |
| RABTUL Wallet | 4004 | Balance management |
| RABTUL Notification | 4005 | Push notifications |

### HOJAI AI Services

| Service | Port | Integration |
|---------|------|-------------|
| HOJAI SkillNet | 5120-5140 | Skill marketplace, execution |
| HOJAI BrandPulse | 4770 | Brand intelligence |
| HOJAI Memory | 4520 | Memory storage |
| HOJAI TwinOS | 4142 | Twin graph |

### Cosmic OS Services

| Service | Port | Integration |
|---------|------|-------------|
| Cosmic OS API | 4070 | Cosmic context |
| Life Pattern Engine | 4053 | Life patterns |
| Life Story Engine | 4056 | Life narratives |
| Emotional Intelligence | 4051 | Emotion analysis |

---

## HEALTH ENDPOINT

**GET** `/health`

```json
{
  "status": "healthy",
  "service": "rez-cosmic-twin",
  "version": "1.0.0",
  "timestamp": "2026-06-14T00:00:00.000Z"
}
```

---

## DOCKER

```bash
# Build
docker build -t rez-cosmic-twin .

# Run
docker run -p 4055:4055 rez-cosmic-twin

# Docker Compose
docker-compose up
```

---

## BUILD STATUS ✅

| Check | Status |
|-------|--------|
| Codebase exists | ✅ |
| TypeScript compiles | ✅ |
| Build succeeds | ✅ |
| Documentation complete | ✅ |
| Health endpoint implemented | ✅ |
| Docker support added | ✅ |
| Environment variables documented | ✅ |

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Verify MONGODB_URI |
| Redis timeout | Verify REDIS_URL |
| JWT validation fails | Verify JWT_SECRET |
| Health check fails | Check all dependencies |

---

## RELATED SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| REZ-trust-os | 4050 | Trust scores, KYC |
| REZ-emotional-intelligence | 4051 | Emotion analysis |
| REZ-human-context-graph | 4052 | Context relationships |
| REZ-life-pattern-engine | 4053 | Pattern detection |
| REZ-memory-engine | 4054 | Memory storage |
| REZ-life-story-engine | 4056 | Life narratives |

---

**Last Updated:** June 14, 2026
