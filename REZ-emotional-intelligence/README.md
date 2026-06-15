# REZ Emotional Intelligence

A microservice that analyzes and tracks user emotional states using in-memory storage with support for trending analysis and mood profiling.

## Features

- Record and track emotional states with intensity and triggers
- Retrieve emotional history and latest state per user
- Analyze emotion trends (rising, falling, stable)
- Generate mood profiles with stability and volatility metrics
- Identify dominant emotions per user

## Endpoints

- `POST /api/emotion/record` - Record a new emotional state
- `GET /api/emotion/latest/:userId` - Get latest emotional state
- `GET /api/emotion/history/:userId` - Get emotional history
- `GET /api/emotion/:userId/:emotionType` - Get states by emotion type
- `GET /api/emotion/profile/:userId` - Get mood profile
- `GET /api/emotion/trend/:userId/:emotionType` - Get emotion trend
- `GET /api/emotion/dominant/:userId` - Get dominant emotion

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```
