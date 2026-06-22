# BuzzLocal Phase 1 Architecture (Cost-Optimized)

**Built:** May 22, 2026
**Approach:** "Build smart, not everything"

---

## Cost Optimization Strategy

### Real-Time vs Poll-Based

| Feature | Implementation | Why |
|---------|--------------|-----|
| Feed | 30s polling | Users don't need instant |
| Vibe Map | 60s refresh | Density doesn't change fast |
| Density | Aggregated batch (5min) | Precision not critical |
| Safety Alerts | Event-driven (critical only) | WebSocket for SOS |
| Ask Buzz | Cached + async | LLM not needed for simple |
| Marketplace | Pull-based | Updates only on action |
| Events | 2min polling | Real-time not needed |

### Only True WebSockets For:
- SOS triggers
- Emergency alerts
- Live chat (future)
- Driver tracking (ReZ Ride)

---

## Phase 1 Services (Minimal Viable)

```
buzzlocal-api-gateway (Port 4020)     # Unified entry, rate limiting
buzzlocal-feed-service (Port 4021)     # Feed + posts
buzzlocal-trust-service (Port 4022)   # Karma + badges
buzzlocal-safety-service (Port 4023)   # Safety alerts + SOS
buzzlocal-movement-service (Port 4028)  # Movement patterns
buzzlocal-creator-service (Port 4029)  # Creator economy
buzzlocal-merchant-dashboard (Port 4030) # Business analytics
buzzlocal-oo2i-service (Port 4031)    # QR + DOOH
```

### Later Phases:
- buzzlocal-ask-service (AI concierge)
- buzzlocal-society-service
- buzzlocal-marketplace-service
- buzzlocal-density-service

---

## Data Flow (Phase 1)

```
User Actions
     │
     ├── Check-in → Movement Service (batched 5min)
     ├── Post → Feed Service (immediate)
     ├── Alert → Safety Service (immediate + push)
     └── View → Analytics (async)

Poll Endpoints (30-60s interval)
     │
     ├── GET /feed (30s)
     ├── GET /vibe-map (60s)
     ├── GET /density (5min batch)
     └── GET /events (2min)
```

---

## AI Strategy (Cost-Controlled)

### Layer 1: Cached Answers (Free)
- Popular queries
- Top places
- FAQ responses

### Layer 2: Vector Search (Cheap)
- Embeddings stored locally
- Semantic search
- Similar places

### Layer 3: LLM (Expensive - Rare)
- Complex queries only
- Conversation follow-ups
- Summarization

---

## Regional Sharding Ready

```typescript
// Area-based routing (ready for future)
const AREA_CLUSTERS = {
  'koramangala': { shard: 1, region: 'bangalore-south' },
  'hsr': { shard: 1, region: 'bangalore-south' },
  'indiranagar': { shard: 2, region: 'bangalore-east' },
  'mg-road': { shard: 3, region: 'bangalore-central' },
};
```

---

## Database Architecture

| Data | DB | Why |
|------|-----|-----|
| Users/Trust | PostgreSQL | ACID, complex queries |
| Feed/Posts | PostgreSQL + Redis cache | Frequent reads |
| Movement | TimescaleDB | Time-series |
| Search | Elasticsearch | Full-text |
| Cache | Redis | Speed |
| Density | Redis (hash) | Fast aggregation |

---

## Monitoring & Cost Control

### Key Metrics
- API latency p99
- Cache hit rate (>90%)
- LLM calls per day
- WebSocket connections
- DB query cost

### Cost Alerts
- LLM spend > $X/day
- API calls spike > 2x
- Cache miss > 15%
