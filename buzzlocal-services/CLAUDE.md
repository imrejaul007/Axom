# BuzzLocal Services - Developer Guide

**Version:** 1.0.1 | **Date:** 2026-06-22

---

## OVERVIEW

BuzzLocal Services is the backend microservices platform powering the BuzzLocal hyperlocal social app. Part of REZ-Consumer.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BuzzLocal App (Mobile)                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ API Gateway   │   │ Realtime Svc  │   │ Notification  │
│    4000      │   │    4012      │   │    4011      │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Mesh                              │
└─────────────────────────────────────────────────────────────┘
```

---

## SERVICES

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-api-gateway | 4000 | Routing, auth, rate limiting |
| buzzlocal-feed-service | 4001 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Vibe areas, check-ins, heatmap |
| buzzlocal-community-service | 4004 | Communities, group posts |
| buzzlocal-ask-service | 4005 | Ask Buzz (AI Q&A) |
| buzzlocal-creator-service | 4006 | Creator tools, analytics |
| buzzlocal-crisis-service | 4007 | Crisis management |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-data-collector | 4009 | Data ingestion |
| buzzlocal-intelligence-service | 4010 | AI intelligence |
| buzzlocal-notification-service | 4011 | Push notifications |
| buzzlocal-realtime-service | 4012 | WebSocket updates |
| buzzlocal-payment-service | 4013 | Payments via Razorpay |
| buzzlocal-weather-service | 4014 | Weather data |
| buzzlocal-safety-service | 4015 | REZ Safe alerts |
| buzzlocal-merchant-dashboard | 4016 | Merchant management |
| buzzlocal-trust-service | 4017 | Trust scores, verification |
| buzzlocal-intelligence-hub | 4018 | AI orchestration |
| buzzlocal-marketplace-service | 4019 | Local marketplace |
| buzzlocal-persona-service | 4020 | User personas |
| buzzlocal-oo2i-service | 4021 | Out-of-home inventory |
| buzzlocal-density-service | 4022 | Crowd density |
| buzzlocal-movement-service | 4023 | Movement analytics |
| buzzlocal-agency-service | 4024 | Agency management |
| buzzlocal-services-service | 4025 | Local services |
| buzzlocal-society-service | 4026 | Society OS |
| buzzlocal-merchant-offer-service | 4027 | Offers & deals |

---

## QUICK START

```bash
# Option 1: Docker Compose (Recommended)
docker compose up -d

# Option 2: Start all services
./start-all.sh

# Option 3: Individual services
for svc in buzzlocal-api-gateway buzzlocal-feed-service buzzlocal-vibe-service buzzlocal-community-service; do
    cd $svc && npm install && npm run dev &
done
```

---

## ENVIRONMENT VARIABLES

```bash
# Service
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/buzzlocal

# Internal Service Token
INTERNAL_SERVICE_TOKEN=

# REZ Services
WALLET_SERVICE_URL=http://localhost:4002
MIND_SERVICE_URL=http://localhost:4005
```

### Service-Specific Variables

**Payment Service:**
```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

**Notification Service:**
```bash
EXPO_ACCESS_TOKEN=
```

**Intelligence Service:**
```bash
REZ_EVENT_PLATFORM_URL=http://localhost:4008
REZ_UNIFIED_RECOMMENDATIONS_URL=http://localhost:4090
REZ_TASTE_PROFILE_URL=http://localhost:4041
```

---

## API ENDPOINTS

### Feed Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | Get personalized feed |
| POST | `/posts` | Create post |
| GET | `/posts/:id` | Get single post |
| POST | `/posts/:id/like` | Like/unlike |
| POST | `/posts/:id/save` | Save/unsave |
| DELETE | `/posts/:id` | Delete post |

### Vibe Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vibe/areas` | Get nearby vibes |
| GET | `/vibe/heatmap` | Get crowd heatmap |
| POST | `/checkin` | Check in |
| POST | `/checkin/out` | Check out |

### Events Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events |
| POST | `/events` | Create event |
| POST | `/tickets` | Purchase ticket |
| POST | `/tickets/checkin` | Check in |

### Payment Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/orders` | Create order |
| POST | `/payments/verify` | Verify payment |
| GET | `/payments/orders` | Get user orders |

---

## TESTING

```bash
# Run tests for a service
cd buzzlocal-feed-service && npm test

# Run with coverage
cd buzzlocal-feed-service && npm test -- --coverage

# Run all service tests
for svc in */; do
    cd "$svc" && npm test 2>/dev/null; cd ..
done
```

---

## DEPLOYMENT

### Docker Compose

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Render

```bash
render deploy --config render.yaml
```

---

## MONITORING

### Health Checks

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4003/health
```

### Logs

```bash
docker compose logs -f buzzlocal-feed-service
```

---

## INTEGRATION

### REZ Intelligence Integration

BuzzLocal integrates with REZ Intelligence for:

| Integration | Purpose |
|-------------|---------|
| Intent Prediction | Personalized recommendations |
| Unified Profile | 360° user view |
| Taste Profile | Interest mapping |
| Event Platform | Event intelligence |
| Autonomous Agents | AI assistants |

---

## ARCHITECTURE DECISIONS

1. **Microservices** - Independent scaling, fault isolation
2. **MongoDB** - Flexible schema for social content
3. **WebSocket** - Real-time updates for feed, vibes
4. **Razorpay** - Payments for events, marketplace
5. **REZ Mind** - AI-powered personalization

---

## LAST UPDATED

**Date:** June 4, 2026
**Version:** 1.0.0
