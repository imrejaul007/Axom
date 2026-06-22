# API.md - BuzzLocal Intelligence Service API Reference

**Version:** 1.0.0
**Base URL:** `http://localhost:4010`
**Authentication:** Bearer Token (via RABTUL Auth)

## Overview

The BuzzLocal Intelligence Service provides AI-powered content analysis including:
- Content moderation
- Sentiment analysis
- Spam detection
- Toxicity detection

## Authentication

All API requests (except `/health`) require a valid Bearer token from RABTUL Auth Service.

```
Authorization: Bearer <token>
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/analysis/analyze | 100 req | 60s |
| POST /api/analysis/analyze/batch | 10 req | 60s |
| GET /api/analysis/* | 200 req | 60s |

## Endpoints

---

### POST /api/analysis/analyze

Analyze a single piece of content.

**Request Body:**
```json
{
  "contentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "text": "This is amazing! I love this feature.",
  "context": "post"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contentId | UUID | Yes | Unique content identifier |
| userId | UUID | Yes | User who posted the content |
| text | String | Yes | Content to analyze (1-10000 chars) |
| context | Enum | No | Context type: `post`, `comment`, `message`, `profile` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contentId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "moderation": {
      "passed": true,
      "categories": [
        {"category": "violence", "confidence": 0.1, "matched": false},
        {"category": "adult", "confidence": 0, "matched": false},
        {"category": "hate_speech", "confidence": 0.05, "matched": false},
        {"category": "harassment", "confidence": 0, "matched": false}
      ],
      "confidence": 0.1,
      "action": "allow"
    },
    "sentiment": {
      "score": 0.85,
      "label": "positive",
      "confidence": 0.92,
      "emotions": {
        "joy": 0.85,
        "anger": 0,
        "sadness": 0,
        "fear": 0,
        "surprise": 0.4
      }
    },
    "spam": {
      "isSpam": false,
      "score": 0.15,
      "reasons": [],
      "confidence": 0.85
    },
    "toxicity": {
      "isToxic": false,
      "score": 0.05,
      "categories": [],
      "confidence": 0.8
    },
    "flagged": false,
    "createdAt": "2024-06-05T10:30:00.000Z"
  },
  "cached": false
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {"path": "text", "message": "String must contain at least 1 character"}
    ]
  }
}
```

---

### POST /api/analysis/analyze/batch

Analyze multiple content items in a single request.

**Request Body:**
```json
{
  "items": [
    {"contentId": "uuid1", "userId": "uuid1", "text": "Content 1", "context": "post"},
    {"contentId": "uuid2", "userId": "uuid2", "text": "Content 2", "context": "comment"}
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| items | Array | Yes | Array of content items (1-100 items) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "contentId": "uuid1",
        "userId": "uuid1",
        "moderation": {...},
        "sentiment": {...},
        "spam": {...},
        "toxicity": {...},
        "flagged": false,
        "createdAt": "2024-06-05T10:30:00.000Z"
      }
    ],
    "total": 2,
    "flagged": 0
  }
}
```

---

### GET /api/analysis/analysis/:contentId

Retrieve analysis result for a specific content item.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| contentId | UUID | Content identifier |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
    "contentId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "text": "This is amazing!",
    "context": "post",
    "moderation": {...},
    "sentiment": {...},
    "spam": {...},
    "toxicity": {...},
    "flagged": false,
    "createdAt": "2024-06-05T10:30:00.000Z",
    "updatedAt": "2024-06-05T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Analysis not found for this content ID"
  }
}
```

---

### GET /api/analysis/analysis/user/:userId

Get analysis history for a specific user.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | User identifier |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | Number | 20 | Results per page (1-100) |
| offset | Number | 0 | Pagination offset |
| flagged | Boolean | - | Filter by flagged status |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

### GET /api/analysis/stats/flagged

Get statistics about flagged content.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO Date | Start of date range |
| endDate | ISO Date | End of date range |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalFlagged": 245,
    "avgToxicityScore": 0.72,
    "avgSpamScore": 0.58
  }
}
```

---

### GET /api/analysis/stats/sentiment

Get sentiment distribution over time.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | String | 7d | Time period: `7d`, `30d`, `90d` |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "distribution": [
      {"label": "positive", "count": 1250, "percentage": 55.2},
      {"label": "neutral", "count": 800, "percentage": 35.4},
      {"label": "negative", "count": 215, "percentage": 9.4}
    ],
    "total": 2265,
    "period": "7d"
  }
}
```

---

### GET /health

Health check endpoint (no authentication required).

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600.5,
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Response Codes

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## Webhooks

This service can trigger webhooks when content is flagged:

```json
{
  "event": "content.flagged",
  "timestamp": "2024-06-05T10:30:00.000Z",
  "data": {
    "contentId": "uuid",
    "userId": "uuid",
    "reason": "toxicity",
    "score": 0.85,
    "action": "warn"
  }
}
```

## SDK Usage

```typescript
import { createEcosystemClient } from '@rez/sdk';

const client = createEcosystemClient({
  baseUrl: 'https://api.rez.com',
  apiKey: process.env.REZ_API_KEY
});

// Analyze content
const analysis = await client.axom.buzzlocal.intelligence.analyze({
  contentId: 'uuid',
  userId: 'uuid',
  text: 'Content to analyze',
  context: 'post'
});

// Get analysis by content ID
const result = await client.axom.buzzlocal.intelligence.getAnalysis('contentId');

// Get user history
const history = await client.axom.buzzlocal.intelligence.getUserHistory('userId', {
  limit: 20,
  offset: 0
});

// Get sentiment stats
const stats = await client.axom.buzzlocal.intelligence.getSentimentStats('7d');
```

## Change Log

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-01-01 | Initial API release |