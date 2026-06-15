# BuzzLocal Intelligence Service

AI-powered content moderation, sentiment analysis, spam detection, and toxicity detection for the BuzzLocal social platform.

## Features

- **Content Moderation**: Detects prohibited content including violence, hate speech, harassment, and adult content
- **Sentiment Analysis**: Analyzes text sentiment (positive/negative/neutral) with emotion detection
- **Spam Detection**: Identifies spam patterns, excessive caps, repetition, and suspicious keywords
- **Toxicity Detection**: Detects toxic content across multiple categories
- **Batch Processing**: Analyze multiple content items in a single request
- **Caching**: Redis-based caching for improved performance
- **Statistics**: Sentiment distribution and flagged content analytics

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
PORT=4010
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/buzzlocal-intelligence
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
SENTIMENT_THRESHOLD=0.5
TOXICITY_THRESHOLD=0.7
SPAM_THRESHOLD=0.6
LOG_LEVEL=info
LOG_FORMAT=json
```

## API Endpoints

### Analyze Content
```bash
POST /api/analysis/analyze
Content-Type: application/json

{
  "contentId": "uuid",
  "userId": "uuid",
  "text": "Your content here",
  "context": "post"
}
```

### Batch Analyze
```bash
POST /api/analysis/analyze/batch
Content-Type: application/json

{
  "items": [
    { "contentId": "uuid1", "userId": "uuid", "text": "Content 1" },
    { "contentId": "uuid2", "userId": "uuid", "text": "Content 2" }
  ]
}
```

### Get Analysis by Content ID
```bash
GET /api/analysis/analysis/:contentId
```

### Get User Analysis History
```bash
GET /api/analysis/analysis/user/:userId?limit=20&offset=0&flagged=true
```

### Get Flagged Content Stats
```bash
GET /api/analysis/stats/flagged?startDate=2024-01-01&endDate=2024-12-31
```

### Get Sentiment Distribution
```bash
GET /api/analysis/stats/sentiment?period=7d
```

### Health Check
```bash
GET /health
```

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

## License

Proprietary - AXOM (A subsidiary of HOJAI-AI)