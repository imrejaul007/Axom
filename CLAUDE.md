# AXOM - Social & Entertainment

**Version:** 1.0.0
**Updated:** June 4, 2026

---

## COMPANY BOUNDARY

AXOM owns social and entertainment products for the REZ ecosystem.

### What AXOM Owns

| Product | Type | Description |
|---------|------|-------------|
| **BuzzLocal** | Social Safety App | Community-driven safety, local discovery, neighborhood watch |
| **Rendezvous** | Social App | Social events and meetups |

### What AXOM Does NOT Own

| Service | WRONG Folder | CORRECT Company |
|---------|-------------|-----------------|
| rez-app | REZ-Consumer/ | **REZ-Consumer** |
| do (AI Chat) | REZ-Consumer/ | **REZ-Consumer** |
| buzzlocal | REZ-Consumer/ | **AXOM** (this company) |

---

## PRODUCTS

### BuzzLocal

**Location:** `buzzlocal/`

**Components:**
```
buzzlocal/
├── mobile/          # React Native mobile app
│   ├── app/         # 69 screens
│   ├── src/         # Source code
│   ├── components/  # UI components
│   ├── services/    # API services
│   └── hooks/       # Custom hooks
├── backend/         # 9 microservices
│   ├── buzzlocal-community-service/
│   ├── buzzlocal-feed-service/
│   ├── buzzlocal-intelligence-service/
│   ├── buzzlocal-notification-service/
│   ├── buzzlocal-payment-service/
│   ├── buzzlocal-realtime-service/
│   ├── buzzlocal-vibe-service/
│   ├── buzzlocal-weather-service/
│   └── z-events-service/
└── docs/            # Architecture docs
```

**Features:**
- Community Safety (SOS, trusted circle, neighborhood watch)
- Local Discovery (places, events, deals)
- Social Feed (posts, comments, reactions)
- Society Management
- Weather Alerts
- Real-time Chat

### Rendezvous

**Location:** `rendez/`

**Status:** Backend services scaffolded

---

## CROSS-COMPANY INTEGRATION

### With RABTUL Technologies

```typescript
// Authentication
AUTH_SERVICE_URL=http://localhost:4002

// Wallet (for karma/coins)
WALLET_SERVICE_URL=http://localhost:4004

// Payment (premium features)
PAYMENT_SERVICE_URL=http://localhost:4001
```

### With KHAIRMOVE

```typescript
// Rides integration for community rides
RIDES_SERVICE_URL=http://localhost:4601

// BuzzLocal rides integration service
BUZZLOCAL_RIDES_URL=http://localhost:4606
```

**Note:** Rides integration is at `/KHAIRMOVE/buzzlocal-rides-integration/`

### With REZ-Intelligence

```typescript
// AI-based content moderation
MODERATION_SERVICE_URL=http://localhost:4018

// Intent prediction
INTENT_SERVICE_URL=http://localhost:4018
```

### With REZ-Consumer

```typescript
// Optional: REZ app cross-promotion
REZ_APP_URL=https://rez-app.rezaiconnect.com
```

---

## BACKLOG (Not Built)

The following products should be built under AXOM but are currently elsewhere:

| Product | Current Location | Status |
|---------|-----------------|--------|
| Cosmic-OS | /hojai-ai/ | Should be moved here |
| ReZ OS | /hojai-ai/ | Should be built here |
| RezChat | /hojai-ai/ | Should be built here |
| ReZ Voice | /hojai-ai/ | Should be built here |
| Z-Events | /hojai-ai/ | Should be built here |

**Note:** These were placed in HOJAI-AI during initial development but belong architecturally under AXOM as social/entertainment products.

---

## PORT ALLOCATION

| Port | Service | Purpose |
|------|---------|---------|
| 4100 | buzzlocal-api-gateway | BuzzLocal entry |
| 4101 | buzzlocal-feed-service | Social feed |
| 4102 | buzzlocal-community-service | Community features |
| 4103 | buzzlocal-notification-service | Push notifications |
| 4104 | buzzlocal-payment-service | Premium features |
| 4105 | buzzlocal-realtime-service | WebSocket chat |
| 4106 | buzzlocal-vibe-service | Location vibes |
| 4107 | buzzlocal-weather-service | Weather alerts |
| 4108 | buzzlocal-intelligence-service | AI moderation |
| 4109 | z-events-service | Events platform |

---

## BUILD COMMANDS

```bash
# BuzzLocal Mobile App
cd buzzlocal/mobile && npm install && npx expo start

# Backend Services
cd buzzlocal/backend/buzzlocal-feed-service && npm run dev

# All backend services
cd buzzlocal/backend
for service in */; do
  cd "$service" && npm run dev &
  cd ..
done
```

---

## SECURITY

- All service-to-service calls require `X-Internal-Token` header
- Never commit `.env` files
- Use Zod for input validation
- Enable content moderation for user-generated content
- Rate limiting on all public endpoints

---

## DOCUMENTATION

- `buzzlocal/SPEC.md` - Full product specification
- `buzzlocal/ARCHITECTURE-PHASE-1.md` - Architecture documentation
- `buzzlocal/CITY-OS-SPEC.md` - City OS integration spec
- `AXOM-DETAILED-AUDIT.md` - Detailed audit

---

**Last Updated:** June 4, 2026
**Version:** 1.0.0
