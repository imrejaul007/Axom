# SOT.md - Source of Truth

## Service Identity

| Property | Value |
|----------|-------|
| **Service Name** | buzzlocal-intelligence-service |
| **Company** | AXOM |
| **Parent Company** | HOJAI-AI |
| **Version** | 1.0.0 |
| **Port** | 4010 |
| **Type** | AI/ML Service |
| **Status** | Production Ready |

## Service Registry

### Service Metadata
- **Service ID**: `buzzlocal-intelligence-001`
- **Environment**: Configurable via NODE_ENV
- **Language**: TypeScript
- **Runtime**: Node.js 18+

### Dependencies
| Dependency | Type | Version | Purpose |
|------------|------|---------|---------|
| express | Runtime | ^4.18.2 | HTTP Server |
| mongoose | Runtime | ^8.2.0 | MongoDB ODM |
| ioredis | Runtime | ^5.3.2 | Redis Client |
| zod | Runtime | ^3.22.4 | Schema Validation |

### Environment Configuration
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

## API Contracts

### POST /api/analysis/analyze
**Request:**
```json
{
  "contentId": "uuid",
  "userId": "uuid",
  "text": "string (1-10000 chars)",
  "context": "post|comment|message|profile (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contentId": "uuid",
    "userId": "uuid",
    "moderation": {
      "passed": true,
      "categories": [{"category": "string", "confidence": 0.5, "matched": false}],
      "confidence": 0.8,
      "action": "allow"
    },
    "sentiment": {
      "score": 0.5,
      "label": "positive",
      "confidence": 0.9,
      "emotions": {"joy": 0.8, "anger": 0, "sadness": 0, "fear": 0, "surprise": 0}
    },
    "spam": {
      "isSpam": false,
      "score": 0.2,
      "reasons": [],
      "confidence": 0.7
    },
    "toxicity": {
      "isToxic": false,
      "score": 0.1,
      "categories": [],
      "confidence": 0.8
    },
    "flagged": false,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "cached": false
}
```

### POST /api/analysis/analyze/batch
**Request:**
```json
{
  "items": [
    {"contentId": "uuid", "userId": "uuid", "text": "string", "context": "string"}
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "total": 10,
    "flagged": 2
  }
}
```

### GET /api/analysis/analysis/:contentId
**Response (200):**
```json
{
  "success": true,
  "data": { ... analysis object ... }
}
```

### GET /api/analysis/stats/flagged
**Query Parameters:** startDate, endDate
**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalFlagged": 100,
    "avgToxicityScore": 0.65,
    "avgSpamScore": 0.45
  }
}
```

## Data Models

### ContentAnalysis (MongoDB Collection: content_analyses)
```typescript
{
  contentId: string,       // UUID, indexed
  userId: string,          // UUID, indexed
  text: string,            // Original text content
  context: enum,           // post|comment|message|profile
  moderation: {
    passed: boolean,
    categories: Array<{category, confidence, matched}>,
    confidence: number,
    action: 'allow' | 'warn' | 'block'
  },
  sentiment: {
    score: number,         // -1 to 1
    label: 'positive' | 'negative' | 'neutral',
    confidence: number,
    emotions: {joy, anger, sadness, fear, surprise}
  },
  spam: {
    isSpam: boolean,
    score: number,
    reasons: string[],
    confidence: number
  },
  toxicity: {
    isToxic: boolean,
    score: number,
    categories: Array<{type, score}>,
    confidence: number
  },
  flagged: boolean,       // indexed
  createdAt: Date,         // indexed
  updatedAt: Date
}
```

## Database Indexes

| Collection | Field | Type | Purpose |
|------------|-------|------|---------|
| content_analyses | contentId | asc | Unique lookup |
| content_analyses | userId | asc | User history |
| content_analyses | createdAt | desc | Time-based queries |
| content_analyses | flagged | asc | Flag filtering |
| content_analyses | sentiment.label | asc | Sentiment grouping |
| content_analyses | toxicity.isToxic | asc | Toxicity filtering |

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request body |
| NOT_FOUND | 404 | Analysis not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/analysis/analyze | 100 req | 1 min |
| POST /api/analysis/analyze/batch | 10 req | 1 min |
| GET /api/analysis/* | 200 req | 1 min |

## Health Check

**GET /health**
```json
{
  "status": "healthy|degraded|unhealthy",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "mongodb": "connected|disconnected",
    "redis": "connected|disconnected"
  }
}
```

## Service Connections

| Connected Service | Port | Protocol | Purpose |
|------------------|------|----------|---------|
| RABTUL Auth Service | 3000 | REST | User authentication |
| RABTUL Notification | 3001 | REST | Alert notifications |
| buzzlocal-feed-service | 4000 | Internal | Content analysis requests |
| buzzlocal-community-service | 4004 | Internal | Community moderation |

## Caching Strategy

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| analysis:{contentId} | 3600s | Content analysis cache |
| sentiment:{contentId} | 7200s | Sentiment results |
| stats:flagged:daily | 300s | Daily flagged stats |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial release |

## Audit Trail

- **Created**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Status**: Production Ready