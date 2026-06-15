# Cosmic-OS

**The Future of Mobile Operating Systems**

![Cosmic-OS Banner](https://img.shields.io/badge/Cosmic-OS-Future-00d4ff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-00ff88?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-ff6b35?style=for-the-badge)

Cosmic-OS is an astrology-based life operating system that provides cosmic guidance, digital twin services, and narrative intelligence for the REZ ecosystem. It reimagines mobile experience with cosmic, space-inspired design.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Cosmic-OS represents a paradigm shift in mobile interface design. Built on the principles of spatial computing and ambient intelligence, it creates an immersive experience that feels like navigating through the cosmos itself.

### Key Principles

- **Cosmic Design Language** - Deep space aesthetics with nebula-inspired color palettes
- **Ambient Intelligence** - Context-aware interfaces that adapt to user behavior
- **Seamless Integration** - Deep connection with the REZ ecosystem
- **Future-Ready Architecture** - Built for next-generation mobile experiences

---

## Features

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
| 9 | **Planet Transits** | Current planetary positions | ✅ |
| 10 | **Moon Phase Tracking** | Daily moon phase | ✅ |
| 11 | **Retrograde Tracking** | Mercury retrograde alerts | ✅ |
| 12 | **Compatibility Analysis** | Sign compatibility | ✅ |
| 13 | **Lucky Numbers/Colors** | Daily lucky elements | ✅ |
| 14 | **Mantras & Affirmations** | Daily spiritual guidance | ✅ |
| 15 | **Wellness Streaks** | Mood check-in streaks | ✅ |
| 16 | **AI Agent Consultation** | Individual agent insights | ✅ |

### AI Life Agents

| Agent | Domain | Capabilities |
|-------|--------|--------------|
| **Career Counselor** | Professional guidance | Job search, promotions, networking |
| **Health Advisor** | Wellness, fitness | Nutrition, exercise, mental health |
| **Relationship Guide** | Personal connections | Dating, marriage, family |
| **Finance Planner** | Money decisions | Investments, budgeting, wealth |
| **Spiritual Guide** | Life purpose | Meditation, purpose, growth |

### Mobile App Features (cosmic-mobile)

- React Native Expo-based mobile interface
- Modern gesture-based navigation
- Dark mode optimized display
- Smooth 60fps animations
- Safe area support
- Cosmic-themed home screen with glow effects

### Backend Services Features (cosmic-os-api)

- Express.js REST API
- Health check endpoints
- Status monitoring
- System metrics collection
- CORS-enabled for cross-origin requests
- Security headers via Helmet

---

## Architecture

```
Cosmic-OS/
├── cosmic-mobile/                      # React Native Expo mobile app
│   ├── src/
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── services/
│   │       └── api.ts              # API client
│   ├── app/
│   │   ├── _layout.tsx             # Root layout
│   │   └── index.tsx               # Home screen
│   └── assets/                      # Icons, splash, favicon
│
├── src/services/
│   ├── cosmic-os-api/               # Express.js REST API
│   │   ├── src/
│   │   │   └── index.ts            # Server entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cosmicService.ts             # Main cosmic service
│
├── README.md                         # This documentation
├── CLAUDE.md                        # Developer guide
└── .env.example                     # Environment template
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        COSMIC OS                             │
│                     (Life Operating System)                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ cosmic-mobile │    │ cosmic-os-api │    │cosmicService │
│  (Port 19006)│    │   (Port 4070) │    │(Ports 4163- │
│               │    │               │    │    4167)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  REZ Ecosystem  │
                    │  (REZ-cosmic-   │
                    │    twin 4055)   │
                    └─────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (for API development)
- npm or yarn package manager
- Docker (optional, for containerized deployment)
- Expo CLI (for mobile development)

### Installation

1. Clone the repository and navigate to the project:

```bash
cd companies/Axom/Cosmic-OS
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`

### Running the API Service

```bash
cd src/services/cosmic-os-api

# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

### Running the Mobile App

```bash
cd cosmic-mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Platform-specific commands
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
```

---

## API Reference

### Health Check (cosmic-os-api)

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "Cosmic OS API",
  "version": "1.0.0",
  "timestamp": "2026-06-14T00:00:00.000Z",
  "environment": "development"
}
```

### System Status

```
GET /api/status
```

Response:
```json
{
  "os": "Cosmic OS",
  "status": "active",
  "uptime": 3600,
  "features": [
    "app-launcher",
    "settings",
    "notifications",
    "theming",
    "system-monitor"
  ],
  "environment": "development"
}
```

### System Metrics

```
GET /api/system
```

Response:
```json
{
  "platform": "darwin",
  "nodeVersion": "v20.0.0",
  "pid": 12345,
  "memory": {
    "rss": "45 MB",
    "heapTotal": "20 MB",
    "heapUsed": "15 MB",
    "external": "5 MB"
  },
  "cpuUsage": {
    "user": 12345,
    "system": 6789
  }
}
```

### App Registry

```
GET /api/apps
```

Response:
```json
{
  "apps": [
    { "id": "launcher", "name": "App Launcher", "icon": "rocket", "status": "active" },
    { "id": "settings", "name": "Settings", "icon": "gear", "status": "active" },
    { "id": "status", "name": "System Status", "icon": "monitor", "status": "active" }
  ],
  "total": 3
}
```

### Cosmic Service Endpoints (cosmicService.ts - Ports 4163-4167)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cosmic/:userId` | Get cosmic context |
| GET | `/api/cosmic/daily/:userId` | Daily reading |
| POST | `/api/cosmic/council` | Consult AI council |
| POST | `/api/mood/checkin` | Mood tracking |
| GET | `/api/guidance/:userId/:domain` | Domain guidance |
| GET | `/api/agents` | List AI agents |
| GET | `/api/user/:userId` | User profile |

---

## Technology Stack

### Mobile

| Technology | Version |
|------------|--------|
| React Native | 0.76.9 |
| Expo SDK | 53 |
| expo-router | 5.0.0 |
| expo-secure-store | Latest |
| axios | Latest |

### Backend

| Technology | Version |
|------------|--------|
| Node.js | 20+ |
| Express.js | 4.18.2 |
| TypeScript | 5.3.3 |
| Helmet | 7.1.0 |
| CORS | 2.8.5 |

---

## Project Structure

```
Cosmic-OS/
├── cosmic-mobile/                    # React Native mobile app
│   ├── src/
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── services/
│   │       └── api.ts              # API client with axios
│   ├── app/
│   │   ├── _layout.tsx            # Root layout with dark theme
│   │   └── index.tsx              # Home screen with launch button
│   ├── assets/                     # Icons, splash, favicon
│   ├── package.json
│   ├── app.json                   # Expo configuration
│   └── tsconfig.json
│
├── src/services/
│   ├── cosmic-os-api/              # Express REST API
│   │   ├── src/
│   │   │   └── index.ts           # Express server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── cosmicService.ts            # Main cosmic service (30KB)
│
├── README.md                        # This file
├── CLAUDE.md                        # Developer guide
├── .env.example                    # Environment template
└── Dockerfile                       # Root Dockerfile
```

---

## Environment Variables

### API Service (.env)

```bash
# Server Configuration
PORT=4070
NODE_ENV=development
API_HOST=localhost
API_PORT=4070

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Security
HELMET_CSP=true
LOG_LEVEL=info
```

### Mobile App (.env)

```bash
# API Configuration
EXPO_PUBLIC_COSMIC_API_URL=http://localhost:4070
```

---

## Deployment

### Docker

Build and run the API service in a container:

```bash
cd src/services/cosmic-os-api

# Build the container
docker build -t cosmic-os-api .

# Run the container
docker run -p 4070:4070 cosmic-os-api
```

### Docker Compose

```yaml
version: '3.8'
services:
  cosmic-os-api:
    build: ./src/services/cosmic-os-api
    ports:
      - "4070:4070"
    environment:
      - NODE_ENV=production
      - PORT=4070
```

---

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| **REZ-cosmic-twin** | 4055 | Digital twin with cosmic context |
| **REZ-life-pattern-engine** | 4053 | Life pattern recognition |
| **REZ-life-story-engine** | 4056 | Life narratives |
| **REZ-emotional-intelligence** | 4051 | Emotion analysis |
| **REZ-memory-engine** | 4054 | Memory storage |
| **REZ-human-context-graph** | 4052 | Context relationships |

---

## License

Part of the REZ ecosystem. All rights reserved.

---

Built with cosmic energy for the future of mobile computing.

**Last Updated:** June 14, 2026
