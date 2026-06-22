# REZ Life Story Engine

A Node.js/TypeScript microservice that creates narrative life stories from user data. It orchestrates chapters, themes, and emotional arcs to generate cohesive personal narratives.

## Features

- Generate comprehensive life stories from user events and memories
- Organize stories into chapters with themes and emotional journeys
- Track story arcs: Growth, Adventure, Transformation, Recovery, Achievement, Exploration, Connection
- In-memory storage for rapid prototyping and testing
- RESTful API with validation and error handling

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/story/generate` | Generate a new life story |
| GET | `/api/story/:userId` | Get user's current story |
| GET | `/api/story/:storyId/chapter/:chapterId` | Get specific chapter |
| POST | `/api/story/:userId/chapter` | Add new chapter |
| PUT | `/api/story/:storyId/chapter/:chapterId` | Update chapter |
| DELETE | `/api/story/:storyId/chapter/:chapterId` | Delete chapter |
| GET | `/api/story/:userId/themes` | Get story themes |
| GET | `/api/story/:storyId/arc` | Get story arc type |
| GET | `/api/story/:userId/summary` | Get life story summary |

## Health Check

```
GET /health
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4056 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | - |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| INTERNAL_SERVICE_TOKEN | Service authentication token | - |

## Story Arcs

- **GROWTH** - Personal development and learning
- **ADVENTURE** - Exploration and discovery
- **TRANSFORMATION** - Major life changes
- **RECOVERY** - Healing and resilience
- **ACHIEVEMENT** - Success and accomplishment
- **EXPLORATION** - Discovery and curiosity
- **CONNECTION** - Relationships and community

## License

Proprietary - Axom Technologies