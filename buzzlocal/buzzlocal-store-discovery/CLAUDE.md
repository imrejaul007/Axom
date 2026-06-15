# CLAUDE.md - BuzzLocal Store Discovery Service

## Project Overview

**Name:** BuzzLocal Store Discovery Service  
**Purpose:** Help customers find nearby stores and businesses  
**FreshMart Story:** 9AM - "Family moves into HSR → searches 'grocery store near me' → BuzzLocal recommends FreshMart"  
**Location:** `companies/Axom/buzzlocal/buzzlocal-store-discovery/`  
**Port:** 4020

---

## FreshMart Story Context

### 9 AM - Customer Discovery

**Story:** A family moves into HSR Layout. They open REZ App and search:
> "Grocery store near me"

BuzzLocal recommends FreshMart because:
- Best reviews (4.8 rating)
- Best match (grocery specialist)
- Fastest delivery
- Family-friendly inventory

---

## Features

### Store Discovery
- **Location-based:** Find stores by GPS coordinates
- **AI Recommendations:** Score and rank stores by relevance
- **New Resident Tracking:** Welcome and guide new movers
- **Match Scoring:** Rate stores based on multiple factors

### Scoring Components
| Component | Weight | Description |
|-----------|--------|-------------|
| Distance | 25% | Proximity to customer |
| Rating | 20% | Customer reviews |
| Reviews | 10% | Number of reviews |
| Delivery | 15% | Delivery availability |
| Match | 15% | Category expertise |
| Freshness | 5% | Data recency |
| Engagement | 10% | Click-through rate |

---

## Architecture

```
buzzlocal-store-discovery/
├── src/
│   ├── index.js                    # Main entry (Port 4020)
│   ├── models/
│   │   └── storeDiscovery.model.js # StoreDiscovery, StoreRecommendation, NewResident
│   ├── services/
│   │   └── storeDiscovery.service.js  # Discovery logic
│   └── routes/
│       └── storeDiscovery.routes.js    # API routes
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discovery/stores` | Discover stores near location |
| GET | `/api/discovery/stores/nearby` | Get nearby stores |
| POST | `/api/discovery/stores/select` | Record store selection |
| POST | `/api/discovery/stores/register` | Register new store |
| PATCH | `/api/discovery/stores/:id/scores` | Update store scores |
| GET | `/api/discovery/neighborhood/:name/analytics` | Get neighborhood analytics |

---

## Data Models

### StoreDiscovery
```javascript
{
  discovery_id: String,
  user_id: String,
  user_type: 'resident' | 'new_mover' | 'visitor',
  location: {
    address, neighborhood,
    coordinates: { lat, lng }
  },
  search: { query, category, intent },
  results: [{
    store_id, store_name, distance, rating,
    match_score, reasons, delivery_available
  }],
  selected_store: String,
  conversion: 'clicked' | 'selected' | 'ordered'
}
```

### StoreRecommendation
```javascript
{
  store_id: String,
  store_name: String,
  category: 'grocery' | 'restaurant' | ...
  neighborhood: String,
  scores: {
    distance, rating, reviews, delivery,
    match, freshness, engagement
  },
  total_score: Number,  // Weighted average
  searches: Number,
  clicks: Number,
  conversions: Number
}
```

### NewResident
```javascript
{
  resident_id: String,
  move_in_date: Date,
  address, neighborhood, coordinates,
  discovery_completed: Boolean,
  interests: [String],
  welcome_sent: Boolean
}
```

---

## Sample API Response

```json
{
  "success": true,
  "discovery_id": "DIS-ABC123",
  "stores": [
    {
      "store_id": "freshmart-hsr",
      "store_name": "FreshMart",
      "distance": 0.5,
      "rating": 4.8,
      "match_score": 92,
      "reasons": ["Highly rated", "Fast delivery", "Top match"],
      "delivery_available": true,
      "delivery_time": 30,
      "featured": true
    }
  ],
  "top_pick": { ... }
}
```

---

## Integration

### With REZ App
- Receives discovery requests
- Returns recommended stores

### With FreshMart
- Registers store in system
- Updates store scores

### With BuzzLocal
- New resident notifications
- Neighborhood targeting

---

## Development

```bash
cd buzzlocal-store-discovery
npm install
npm start  # Port 4020
npm run dev  # Development mode
```

---

**Last Updated:** June 13, 2026
