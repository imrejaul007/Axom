# REZ Memory Engine

A production-ready Node.js/TypeScript microservice for storing and retrieving user memories/context for AI agents.

## What It Does

REZ Memory Engine persists structured "memories" about users -- facts, preferences, goals, relationships, events, skills, and situational context -- and exposes a REST API so AI agents and services can store, search, and retrieve those memories on demand.

### Memory Types

| Type | Description |
|------|-------------|
| `FACT` | Objective facts about the user |
| `PREFERENCE` | Likes, dislikes, and preferences |
| `EVENT` | Past events and occurrences |
| `GOAL` | User goals and aspirations |
| `RELATIONSHIP` | People and relationships |
| `SKILL` | Abilities and competencies |
| `CONTEXT` | Situational context |

### Memory Categories

| Category | Description |
|----------|-------------|
| `PERSONAL` | Personal information |
| `PROFESSIONAL` | Work and career |
| `SOCIAL` | Social connections |
| `HEALTH` | Health and wellness |
| `FINANCIAL` | Financial information |
| `PREFERENCE` | General preferences |

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

The service starts on port 4054 (configurable via `PORT`).

## API Endpoints

### Store a Memory

```http
POST /api/memory/store
Content-Type: application/json

{
  "userId": "user-123",
  "type": "PREFERENCE",
  "content": "Prefers dark mode",
  "category": "PREFERENCE",
  "tags": ["ui", "settings"],
  "importance": 3
}
```

### Get All Memories for a User

```http
GET /api/memory/:userId?page=1&limit=20
```

### Search Memories

```http
GET /api/memory/:userId/search?q=dark+mode
```

### Get by Category

```http
GET /api/memory/:userId/category/PREFERENCE
```

### Get AI Context (most relevant memories)

```http
GET /api/memory/:userId/context?maxMemories=10
```

Returns memories sorted by importance and recency, optimized for injecting into AI agent prompts.

### Get Single Memory

```http
GET /api/memory/item/:id
```

### Delete Memory

```http
DELETE /api/memory/:id
```

### Health Check

```http
GET /health
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4054) |
| `NODE_ENV` | No | Environment (development/production) |
| `MONGODB_URI` | No | MongoDB connection string |
| `REDIS_HOST` | No | Redis host for caching |
| `REDIS_PORT` | No | Redis port (default: 6379) |
| `INTERNAL_SERVICE_TOKEN` | No | Token for internal service auth |

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Run compiled server |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
