# Axom - Community Intelligence & BuzzLocal

**Location:** `companies/Axom/`  
**Purpose:** Community discovery, local intelligence, and neighborhood insights  
**Status:** ✅ **50+ SERVICES BUILT** | **June 14, 2026**

---

## Axom Overview

Axom powers BuzzLocal - the community intelligence layer of RTMN that connects residents, businesses, and neighborhoods through AI-powered discovery and engagement.

### BuzzLocal vs Generic Discovery Apps

| Feature | Generic Discovery | BuzzLocal |
|---------|------------------|-----------|
| Community Detection | ❌ | ✅ |
| Society Intelligence | ❌ | ✅ |
| Resident Verification | ❌ | ✅ |
| Local Business Discovery | ❌ | ✅ |
| Neighborhood Trends | ❌ | ✅ |
| Community Events | ❌ | ✅ |
| Bulk Orders | ❌ | ✅ |
| Store Discovery | ❌ | ✅ |

---

## Core Services (50+)

| Service | Port | Description |
|---------|------|-------------|
| **buzzlocal-gateway** | 4300 | API Gateway |
| **buzzlocal-community-service** | 4301 | Community management |
| **buzzlocal-society-service** | 4302 | Society/facility management |
| **buzzlocal-resident-service** | 4303 | Resident profiles |
| **buzzlocal-business-discovery** | 4304 | Business search |
| **buzzlocal-bulkorder-service** | 4305 | Community bulk orders |
| **buzzlocal-neighbor-service** | 4306 | Neighbor matching |
| **buzzlocal-event-service** | 4307 | Community events |
| **buzzlocal-trend-service** | 4308 | Trend analysis |
| **buzzlocal-weather-service** | 4309 | Weather integration |
| **buzzlocal-notification-service** | 4310 | Push notifications |
| **buzzlocal-analytics-service** | 4311 | Community analytics |
| **buzzlocal-verification-service** | 4312 | Resident verification |

---

## Key Features

### Community Intelligence
| Feature | Description |
|---------|-------------|
| Society Detection | Automatically identify apartment complexes |
| Resident Verification | KYC-verified residents only |
| Community Mapping | Visual map of neighborhoods |
| Demographics | Age groups, family sizes, interests |
| Activity Patterns | When communities are most active |

### Business Discovery
| Feature | Description |
|---------|-------------|
| Nearby Search | Find businesses near you |
| Category Filters | Restaurant, Salon, Gym, etc. |
| Rating Aggregation | Combined ratings from multiple sources |
| Distance Sorting | Nearest first |
| Recommendation Engine | Personalized suggestions |

### Neighbor Network
| Feature | Description |
|---------|-------------|
| Neighbor Matching | Connect with similar neighbors |
| Interest Groups | Book clubs, sports, parenting |
| Community Board | Buy/sell, events, announcements |
| Verified Residents | Trust indicators |
| Privacy Controls | Share only what you want |

### Bulk Orders
| Feature | Description |
|---------|-------------|
| Group Buying | Collective purchasing power |
| Order Aggregation | Combine orders from neighbors |
| Discount Negotiation | Volume discounts with businesses |
| Delivery Coordination | Single delivery to society |
| Payment Splitting | Easy split payments |

### Weather Integration
| Feature | Description |
|---------|-------------|
| Real-time Weather | Current conditions |
| 7-Day Forecast | Planning ahead |
| Weather Alerts | Rain, heat, pollution |
| Demand Prediction | Weather-based demand for businesses |
| Festival Calendar | Diwali, Eid, Christmas impact |

---

## API Endpoints

```
# Communities
GET    /api/communities               # List communities
POST   /api/communities               # Create community
GET    /api/communities/:id           # Get community
GET    /api/communities/:id/residents # Get residents

# Societies
GET    /api/societies                 # List societies
GET    /api/societies/nearby          # Nearby societies
POST   /api/societies/:id/join        # Join society

# Residents
GET    /api/residents/:id             # Get resident
POST   /api/residents/verify          # Verify residency
GET    /api/residents/:id/neighbors   # Get neighbors

# Business Discovery
GET    /api/businesses/nearby          # Nearby businesses
GET    /api/businesses/:id            # Business details
POST   /api/businesses/:id/review     # Add review
GET    /api/businesses/category/:cat  # By category

# Bulk Orders
GET    /api/bulkorders                # List bulk orders
POST   /api/bulkorders                # Create bulk order
POST   /api/bulkorders/:id/join       # Join order
POST   /api/bulkorders/:id/execute    # Execute order

# Weather
GET    /api/weather/current           # Current weather
GET    /api/weather/forecast          # 7-day forecast
GET    /api/weather/alerts            # Weather alerts
```

---

## File Structure

```
companies/Axom/
├── buzzlocal/
│   ├── buzzlocal-gateway/            # API Gateway (4300)
│   ├── buzzlocal-community-service/ # Community (4301)
│   ├── buzzlocal-society-service/   # Society (4302)
│   ├── buzzlocal-resident-service/   # Resident (4303)
│   ├── buzzlocal-business-discovery/ # Business (4304)
│   ├── buzzlocal-bulkorder-service/  # Bulk Orders (4305)
│   ├── buzzlocal-neighbor-service/  # Neighbor (4306)
│   ├── buzzlocal-event-service/      # Events (4307)
│   ├── buzzlocal-trend-service/     # Trends (4308)
│   ├── buzzlocal-weather-service/   # Weather (4309)
│   └── ...
└── REZ-buzzlocal-intelligence/       # AI Intelligence
```

---

## Integration with RTMN

| Service | Integration | Purpose |
|---------|-------------|---------|
| Waitron | Weather Connector | Restaurant demand prediction |
| REZ-Consumer | DO App | Business discovery |
| AdBazaar | Promotions | Community-targeted ads |
| RisaCare | Society Health | Health camps |
| Grocery | Bulk Orders | Community grocery |

---

## Quick Start

```bash
# Start Gateway
cd buzzlocal/buzzlocal-gateway && npm install && npm start

# Start community service
cd buzzlocal/buzzlocal-community-service && npm install && npm start

# Health check
curl http://localhost:4300/health
```

---

## Weather Prediction for Restaurants

```javascript
// Example: Weather impacts restaurant demand
{
  condition: "Rain",
  deliveryMultiplier: 1.27,  // +27% delivery
  dineInMultiplier: 0.85,   // -15% dine-in
  takeawayMultiplier: 1.12  // +12% takeaway
}
```
