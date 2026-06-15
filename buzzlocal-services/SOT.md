# BuzzLocal Services - Statement of Truth (SOT)

**Version:** 2.0
**Date:** June 4, 2026
**Status:** Active - Production

---

## EXECUTIVE SUMMARY

**BuzzLocal Services** is the backend platform powering the BuzzLocal hyperlocal social app - part of REZ-Consumer. It provides a complete social infrastructure for hyperlocal communities.

### Vision

Connect every neighborhood - one platform for all local information, social interactions, and services.

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    BuzzLocal App (Mobile)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (4000)                         │
│                 Auth │ Routing │ Rate Limiting                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Feed Service │   │ Vibe Service  │   │Events Service │
│    4001     │   │    4003     │   │    4008     │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│Community Svc │   │  AI Service   │   │ Payment Svc   │
│    4004     │   │    4010     │   │    4013     │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## SERVICES

### Core Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 4000 | buzzlocal-api-gateway | Routing, auth, rate limiting | ✅ |
| 4001 | buzzlocal-feed-service | Posts, feed, AI cards, coins | ✅ |
| 4003 | buzzlocal-vibe-service | Vibe areas, check-ins, heatmap | ✅ |
| 4004 | buzzlocal-community-service | Communities, groups | ✅ |
| 4008 | z-events-service | Events, ticketing, QR | ✅ |
| 4010 | buzzlocal-intelligence-service | AI intelligence | ✅ |
| 4011 | buzzlocal-notification-service | Push notifications | ✅ |
| 4012 | buzzlocal-realtime-service | WebSocket updates | ✅ |
| 4013 | buzzlocal-payment-service | Payments via Razorpay | ✅ |
| 4014 | buzzlocal-weather-service | Weather data | ✅ |

### Extended Services

| Port | Service | Purpose | Status |
|------|---------|---------|--------|
| 4005 | buzzlocal-ask-service | Ask Buzz (AI Q&A) | ✅ |
| 4006 | buzzlocal-creator-service | Creator tools | ✅ |
| 4007 | buzzlocal-crisis-service | Crisis management | ✅ |
| 4009 | buzzlocal-data-collector | Data ingestion | ✅ |
| 4015 | buzzlocal-safety-service | REZ Safe alerts | ✅ |
| 4016 | buzzlocal-merchant-dashboard | Merchant management | ✅ |
| 4017 | buzzlocal-trust-service | Trust scores | ✅ |
| 4018 | buzzlocal-intelligence-hub | AI orchestration | ✅ |
| 4019 | buzzlocal-marketplace-service | Local marketplace | ✅ |
| 4020 | buzzlocal-persona-service | User personas | ✅ |
| 4021 | buzzlocal-oo2i-service | Out-of-home inventory | ✅ |
| 4022 | buzzlocal-density-service | Crowd density | ✅ |
| 4023 | buzzlocal-movement-service | Movement analytics | ✅ |
| 4024 | buzzlocal-agency-service | Agency management | ✅ |
| 4025 | buzzlocal-services-service | Local services | ✅ |
| 4026 | buzzlocal-society-service | Society OS | ✅ |
| 4027 | buzzlocal-merchant-offer-service | Offers & deals | ✅ |

---

## CITY OS LAYERS

BuzzLocal implements a **City OS** architecture:

### Layer 1: Social Core
- Feed, posts, likes, comments
- Communities, groups
- Real-time updates

### Layer 2: Discovery
- Vibe areas (location-based)
- Check-ins
- Crowd heatmap
- Weather

### Layer 3: Commerce
- Marketplace
- Offers & deals
- Payments

### Layer 4: Safety
- REZ Safe alerts
- Crisis management
- Emergency contacts

### Layer 5: Services
- Local services directory
- Society management
- Agency services

---

## REZ SAFE MODULE

**Women Safety** features integrated into BuzzLocal:

| Feature | Description |
|---------|-------------|
| SOS Alert | One-tap emergency alert |
| Live Location | Share location with trusted contacts |
| Journey Tracking | Auto-alert if journey delayed |
| Community Watch | Neighbors can check on you |
| Safe Zones | Area safety ratings |

---

## COIN REWARDS

Users earn **ReZ Coins** for engagement:

| Action | Coins |
|--------|-------|
| Create post | 20 |
| Post with location | +10 |
| Event post | 50 |
| Alert post | 40 |
| Place post | 30 |
| Deal post | 25 |
| Poll post | 15 |
| Receive like | 2 |
| Receive comment | 5 |

---

## INTEGRATION

### REZ Intelligence

| Integration | Purpose |
|-------------|---------|
| Intent Prediction | Personalized feed |
| Taste Profile | Interest mapping |
| Unified Profile | 360° user view |
| Event Intelligence | Event recommendations |

### RABTUL Services

| Service | Purpose |
|---------|---------|
| rez-auth-service | User authentication |
| rez-wallet-service | ReZ Coins |
| rez-payment-service | Payments |

---

## API ENDPOINTS

### Feed

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | Get personalized feed |
| POST | `/posts` | Create post |
| POST | `/posts/:id/like` | Like post |
| GET | `/feed/ai-cards` | Get AI cards |

### Vibe

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vibe/areas` | Get nearby vibes |
| GET | `/vibe/heatmap` | Get crowd heatmap |
| POST | `/checkin` | Check in |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events |
| POST | `/tickets` | Purchase ticket |
| POST | `/tickets/checkin` | QR check-in |

---

## ENVIRONMENT VARIABLES

```bash
# Service
PORT=4000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/buzzlocal

# Redis
REDIS_URL=redis://localhost:6379

# Internal Token
INTERNAL_SERVICE_TOKEN=

# External Services
WALLET_SERVICE_URL=http://localhost:4002
```

---

## DEPLOYMENT

### Docker Compose

```bash
# City OS (all services)
docker compose -f docker-compose.city-os.yml up -d

# Core services only
docker compose up -d
```

---

## MONITORING

### Health Checks

```bash
curl http://localhost:4000/health  # Gateway
curl http://localhost:4001/health  # Feed
curl http://localhost:4003/health  # Vibe
curl http://localhost:4012/health  # Realtime
```

### Metrics

- DAU/MAU ratio
- Post engagement rate
- Check-in volume
- Event ticket sales
- Payment success rate

---

## KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| WebSocket reconnection | Medium | Fixed in v2 |
| Cold start for AI cards | Low | Optimizing |

---

## ROADMAP

### Q3 2026

- [ ] Video posts
- [ ] Live streaming
- [ ] Short-form videos

### Q4 2026

- [ ] Stories feature
- [ ] AR filters
- [ ] NFT badges

---

## LAST UPDATED

**Date:** June 4, 2026
**Version:** 2.0
