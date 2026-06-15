# BuzzLocal Data Collector

**Port:** 4027
**Purpose:** Collect and send BuzzLocal user data to REZ Intelligence for continuous learning

---

## Data Flow

```
BuzzLocal User Actions
        │
        ▼
buzzlocal-data-collector (4027)
        │
        ├──────────────────────────────────┐
        │                                  │
        ▼                                  ▼
REZ Signal Aggregator              REZ Intent Graph
(Behavioral tracking)             (Intent training)
        │                                  │
        ▼                                  ▼
REZ Realtime Segments             REZ Predictive Engine
(User segmentation)              (Model training)
        │
        ▼
REZ Unified Profile
(Profile updates)
```

---

## Data Collected

| Signal Type | REZ Service | Purpose |
|-------------|------------|---------|
| User actions | Signal Aggregator | Behavioral patterns |
| Intent queries | Intent Graph | AI training data |
| Safety events | Care Service | Emergency patterns |
| Commerce signals | Segments | Purchase intent |
| Check-ins | Density | Location patterns |
| Searches | Intent Graph | Search patterns |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signals/action` | Log user action |
| POST | `/api/signals/intent` | Log Ask Buzz query |
| POST | `/api/signals/safety` | Log safety event |
| POST | `/api/signals/commerce` | Log commerce interaction |
| POST | `/api/signals/checkin` | Log location check-in |
| POST | `/api/signals/search` | Log search query |
| POST | `/api/signals/batch` | Batch signal send |

---

## Usage

```typescript
// Log user action
await fetch('http://localhost:4027/api/signals/action', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user123',
    actionType: 'view_offer',
    context: { location: { lat: 12.9, lng: 77.6, area: 'Koramangala' } },
    metadata: { offerId: 'offer456' }
  })
});

// Log Ask Buzz intent
await fetch('http://localhost:4027/api/signals/intent', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user123',
    query: 'best gym nearby',
    intent: 'fitness_search',
    entities: { category: 'fitness' },
    responseType: 'local_business',
    satisfied: true,
    followUp: false
  })
});

// Log check-in
await fetch('http://localhost:4027/api/signals/checkin', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user123',
    location: { lat: 12.9, lng: 77.6 },
    area: 'Koramangala',
    placeType: 'cafe'
  })
});
```

---

## Environment Variables

```bash
# REZ Intelligence
REZ_SIGNAL_AGGREGATOR_URL=http://localhost:4121
REZ_INTENT_GRAPH_URL=http://localhost:4050
REZ_REALTIME_SEGMENTS_URL=http://localhost:4126
REZ_PREDICTIVE_ENGINE_URL=http://localhost:4123
REZ_UNIFIED_PROFILE_URL=http://localhost:4120
REZ_CARE_SERVICE_URL=http://localhost:4055

# Internal
INTERNAL_SERVICE_TOKEN=your-token
```

---

## Model Training Loop

1. User interacts with BuzzLocal
2. Data Collector captures signal
3. Signal sent to REZ Intelligence
4. REZ models update based on signal
5. BuzzLocal receives improved predictions
6. Better user experience → More signals → Better models

This creates a continuous improvement loop.
