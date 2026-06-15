# FEATURES.md - BuzzLocal Store Discovery Service

**Last Updated:** June 13, 2026  
**FreshMart Story:** 9AM - "Family moves into HSR → searches 'grocery store near me' → BuzzLocal recommends FreshMart"

---

## Overview

Store Discovery helps customers find nearby businesses and helps stores reach new customers through AI-powered recommendations.

---

## Features

### 1. Location Discovery

| Feature | Description |
|---------|-------------|
| GPS Search | Find stores by current location |
| Neighborhood Search | Search by area name |
| Radius Search | Search within X km |
| Category Filter | Filter by business type |

### 2. AI Recommendations

| Feature | Description |
|---------|-------------|
| Match Scoring | Score stores by relevance |
| Personalized | Based on user preferences |
| Social Proof | Show why others choose |
| Distance | Prioritize nearby |

### 3. Scoring Algorithm

| Component | Weight | Description |
|-----------|--------|-------------|
| Distance | 25% | Proximity to customer |
| Rating | 20% | Customer reviews (0-5) |
| Reviews Count | 10% | Number of reviews |
| Delivery | 15% | Delivery availability |
| Match | 15% | Category expertise |
| Freshness | 5% | Data recency |
| Engagement | 10% | Click-through rate |

### 4. New Resident Features

| Feature | Description |
|---------|-------------|
| Move Detection | Track new arrivals |
| Welcome | Personalized welcome |
| Guide | Help discover local stores |
| Preferences | Learn preferences |

---

## API Endpoints

### Discover Stores
```bash
POST /api/discovery/stores
{
  "user_id": "user-001",
  "user_type": "resident",
  "location": {
    "address": "HSR Layout, Bangalore",
    "neighborhood": "HSR Layout",
    "coordinates": { "lat": 12.91, "lng": 77.64 }
  },
  "search": {
    "query": "grocery store",
    "category": "grocery",
    "intent": "nearby"
  }
}
```

### Get Nearby
```bash
GET /api/discovery/stores/nearby?lat=12.91&lng=77.64&category=grocery&limit=10
```

### Record Selection
```bash
POST /api/discovery/stores/select
{
  "discoveryId": "DIS-ABC123",
  "storeId": "freshmart-hsr",
  "reason": "Best rating"
}
```

### Register Store
```bash
POST /api/discovery/stores/register
{
  "store_id": "freshmart-hsr",
  "store_name": "FreshMart",
  "category": "grocery",
  "location": { "lat": 12.91, "lng": 77.64 },
  "rating": 4.8,
  "delivery_available": true
}
```

---

## Data Models

### StoreDiscovery
Records each discovery event.

### StoreRecommendation
Scores and data for each store.

### NewResident
Tracks new residents for welcome campaigns.

---

## Sample Response

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
      "reasons": [
        "Highly rated",
        "Fast delivery",
        "Top match"
      ],
      "delivery_available": true,
      "delivery_time": 30,
      "featured": true
    }
  ],
  "top_pick": { ... }
}
```

---

## FreshMart 9AM Flow

```
9:00 AM - Family moves to HSR
    ↓
REZ App → Search "grocery store near me"
    ↓
POST /api/discovery/stores
    ↓
Store Discovery queries neighborhood
    ↓
FreshMart has best score (4.8 rating, delivery)
    ↓
FreshMart recommended to customer ✅
    ↓
Customer visits FreshMart ✅
```

---

## Integration

### Input Sources
| Source | Data |
|--------|------|
| REZ App | User location, search query |
| FreshMart | Store data, ratings |
| Karma | User preferences |
| BuzzLocal | Neighborhood data |

### Output Targets
| Target | Use |
|--------|-----|
| REZ App | Display results |
| FreshMart | Update scores |
| BuzzLocal | New resident notifications |

---

**Last Updated:** June 13, 2026
