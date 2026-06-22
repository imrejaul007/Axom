# Cosmic-OS - Developer Guide

**Version:** 1.0.0
**Updated:** June 14, 2026
**Status:** Production Ready

---

## OVERVIEW

Cosmic-OS is an astrology-based life operating system that provides cosmic guidance, digital twin services, and narrative intelligence for the REZ ecosystem. It reimagines mobile experience with cosmic, space-inspired design.

## COMPONENTS

| Component | Description | Status | Port |
|-----------|-------------|--------|------|
| cosmic-mobile | React Native Expo mobile app | ✅ Production Ready | 19006 (dev) |
| src/services/cosmic-os-api | Express.js REST API | ✅ Production Ready | 4070 |
| src/services/cosmicService.ts | Main cosmic service | ✅ Built | 4163-4167 |
| README.md | Full documentation | ✅ Complete | - |
| CLAUDE.md | This developer guide | ✅ Complete | - |
| .env.example | Environment configuration | ✅ Complete | - |

---

## PROJECT STRUCTURE

```
Cosmic-OS/
├── README.md                          # Full documentation
├── CLAUDE.md                          # This developer guide
├── .env.example                       # Environment template
├── Dockerfile                         # Root Dockerfile reference
├── cosmic-mobile/                     # React Native Expo app
│   ├── package.json                   # Mobile dependencies
│   ├── app.json                      # Expo configuration
│   ├── tsconfig.json                 # TypeScript config
│   ├── babel.config.js               # Babel config
│   ├── assets/                       # Icons, splash, favicon (CREATED)
│   └── app/                          # App screens
│       ├── _layout.tsx               # Root layout
│       └── index.tsx                 # Home screen
│
└── src/services/
    ├── cosmic-os-api/                 # Express API
    │   ├── package.json              # API dependencies
    │   ├── tsconfig.json             # TypeScript config
    │   ├── Dockerfile                # Container config
    │   └── src/
    │       └── index.ts              # Express server
    │
    └── cosmicService.ts              # Main cosmic service (30KB)
```

---

## FEATURES (16 Total)

### Core Features
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Daily Cosmic Reading** | Astrology-based daily guidance | ✅ |
| 2 | **Council of Agents** | Multi-agent AI consultation | ✅ |
| 3 | **Mood Check-In** | Wellness tracking | ✅ |
| 4 | **Domain Guidance** | Career, health, relationships, finance | ✅ |
| 5 | **Life Story Engine** | Narrative intelligence | ✅ |
| 6 | **Life Pattern Engine** | Pattern recognition | ✅ |
| 7 | **Cosmic Twin** | Digital twin with cosmic context | ✅ |
| 8 | **Birth Chart Analysis** | Sun, Moon, Rising signs | ✅ |

### Additional Features
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 9 | **Planet Transits** | Current planetary positions | ✅ |
| 10 | **Moon Phase Tracking** | Daily moon phase | ✅ |
| 11 | **Retrograde Tracking** | Mercury retrograde alerts | ✅ |
| 12 | **Compatibility Analysis** | Sign compatibility | ✅ |
| 13 | **Lucky Numbers/Colors** | Daily lucky elements | ✅ |
| 14 | **Mantras & Affirmations** | Daily spiritual guidance | ✅ |
| 15 | **Wellness Streaks** | Mood check-in streaks | ✅ |
| 16 | **AI Agent Consultation** | Individual agent insights | ✅ |

---

## AI LIFE AGENTS

| Agent | Domain | Capabilities |
|-------|--------|--------------|
| **Career Counselor** | Professional guidance | Job search, promotions, networking |
| **Health Advisor** | Wellness, fitness | Nutrition, exercise, mental health |
| **Relationship Guide** | Personal connections | Dating, marriage, family |
| **Finance Planner** | Money decisions | Investments, budgeting, wealth |
| **Spiritual Guide** | Life purpose | Meditation, purpose, growth |

---

## QUICK START

### API Service

```bash
cd src/services/cosmic-os-api
npm install
npm run dev          # Development with hot reload
npm run build        # Production build
npm start            # Run production build
```

### Mobile App

```bash
cd cosmic-mobile
npm install
npm start            # Start Expo dev server
npm run android      # Android
npm run ios           # iOS
npm run web           # Web
```

### Docker Deployment

```bash
cd src/services/cosmic-os-api
docker build -t cosmic-os-api .
docker run -p 4070:4070 cosmic-os-api
```

---

## API ENDPOINTS

### cosmic-os-api (Port 4070)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check with status info |
| /api/status | GET | OS status and features |
| /api/system | GET | System metrics (memory, CPU) |
| /api/apps | GET | Registered apps registry |

### cosmicService.ts (Ports 4163-4167)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/cosmic/:userId | GET | Get cosmic context |
| /api/cosmic/daily/:userId | GET | Daily reading |
| /api/cosmic/council | POST | Consult AI council |
| /api/mood/checkin | POST | Mood tracking |
| /api/mood/:userId/history | GET | Mood history |
| /api/guidance/:userId/:domain | GET | Domain guidance |
| /api/agents | GET | List AI agents |
| /api/agents/:agentType/consult | POST | Consult agent |
| /api/user/:userId | GET | User profile + wallet + streak |
| /api/user/:userId/wallet | GET | User wallet |
| /api/user/:userId/streak | GET | Wellness streak |
| /api/rewards/mindfulness | POST | Record mindfulness |
| /api/rewards/journal | POST | Record journal |

---

## PORT ALLOCATION

| Service | Port | Description |
|---------|------|-------------|
| cosmic-os-api | 4070 | Main API service |
| cosmic-mobile | 19006 | Expo dev server (default) |

---

## LIFE STORY ENGINE (Port 4167)

| Feature | Description |
|---------|-------------|
| **Narrative Intelligence** | Turning data into meaningful stories |
| **Story Arcs** | Character, setting, conflict, resolution |
| **Cosmic Narrative** | Life as mythology |
| **Personal Mythology** | User's unique life narrative |
| **Timeline Narrative** | Events as chapters |
| **Daily Narrative** | Day-by-day storytelling |

---

## TECHNOLOGY STACK

### Mobile
- React Native 0.76.9
- Expo SDK 53
- expo-router 5.0.0
- expo-secure-store (NEW)
- axios (NEW)
- TypeScript

### Backend
- Node.js 20+
- Express.js 4.18.2
- TypeScript 5.3.3
- Helmet (security)
- CORS

---

## ENVIRONMENT VARIABLES

```bash
# API Service
PORT=4070
NODE_ENV=development
API_HOST=localhost
API_PORT=4070
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
HELMET_CSP=true
LOG_LEVEL=info

# Mobile App
EXPO_PUBLIC_COSMIC_API_URL=http://localhost:4070
```

---

## TYPE DEFINITIONS (src/types.ts)

```typescript
// Cosmic Context
interface CosmicState {
  planets: PlanetPosition[];
  aspects: Aspect[];
  moonPhase: string;
  retrograde: string[];
}

interface DailyReading {
  date: string;
  overview: string;
  luckyNumber: number;
  luckyColor: string;
  compatibleSign: string;
  mantra: string;
  affirmations: string[];
  warnings: string[];
  cosmicTip: string;
}

// Council of Agents
interface AgentInsight {
  agent: string;
  domain: string;
  advice: string;
  confidence: number;
}

// Mood Tracking
interface MoodCheckIn {
  userId: string;
  mood: 'excellent' | 'good' | 'neutral' | 'low' | 'bad';
  energy: number;
  stress: number;
}

interface WellnessStreak {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: string;
  weeklyGoal: number;
  weeklyProgress: number;
}

// Domain Guidance
type Domain = 'career' | 'health' | 'relationships' | 'finance' | 'spiritual';

interface DomainGuidance {
  domain: Domain;
  title: string;
  overview: string;
  actionItems: string[];
  warnings: string[];
  affirmations: string[];
  luckyElement: string;
  bestTime: string;
}

// AI Agents
interface Agent {
  id: string;
  name: string;
  domain: Domain;
  avatar: string;
  expertise: string[];
  personality: string;
  description: string;
  availability: 'online' | 'busy' | 'offline';
}
```

---

## RELATED SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| REZ-cosmic-twin (Axom) | 4055 | Digital twin with cosmic context |
| REZ-cosmic-twin (hojai) | 4055 | Digital twin (hojai) |
| REZ-life-pattern-engine | 4053 | Life pattern recognition |
| REZ-life-story-engine | 4056 | Life narratives |
| REZ-emotional-intelligence | 4051 | Emotion AI |
| REZ-memory-engine | 4054 | Memory storage |

---

## BUG FIXES APPLIED (June 14, 2026)

| # | Issue | Fix |
|---|-------|-----|
| 1 | TypeScript compiler missing | Reinstalled node_modules |
| 2 | Missing `types.ts` file | Created src/types.ts |
| 3 | Missing `expo-secure-store` | Installed dependency |
| 4 | Missing `axios` | Installed dependency |
| 5 | Missing `assets/` directory | Created with placeholder images |
| 6 | Wrong API port (4163 vs 4070) | Fixed to port 4070 |
| 7 | LawGens REZ-cosmic-twin build error | Fixed TypeScript installation |
| 8 | LawGens MCP cosmic-twin build error | Fixed TypeScript installation |

---

## DEVELOPMENT NOTES

- ES Modules (type: "module") in API
- Strict TypeScript mode enabled
- Multi-stage Docker builds for optimization
- Non-root container user for security
- Health checks in Docker

---

## BUILD STATUS (All Passing ✅)

| Service | TypeScript | Build |
|---------|-----------|-------|
| cosmic-os-api | ✅ | ✅ |
| cosmic-mobile | ✅ | - |
| REZ-cosmic-twin (Axom) | ✅ | ✅ |
| REZ-cosmic-twin (hojai) | ✅ | ✅ |
| REZ-cosmic-twin (LawGens) | ✅ | ✅ |
| MCP cosmic-twin (LawGens) | ✅ | ✅ |

---

**Last Updated:** June 14, 2026
