# BuzzLocal City OS - Complete Documentation

**Positioning:** "Live Pulse of Your City" / "City Operating System"
**Version:** 2.0.0
**Last Updated:** 2026-05-19

---

## Quick Start

```bash
# Start all services
./start-city-os.sh

# Or use Docker Compose directly
docker-compose -f docker-compose.city-os.yml up -d
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BuzzLocal City OS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Discover│  │   Ask   │  │Community│  │  Safe   │        │
│  │  Layer  │  │  Layer  │  │  Layer  │  │  Layer  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │                 │
│  ┌────┴────────────┴────────────┴────────────┴────┐           │
│  │           CITY INTELLIGENCE ENGINE             │           │
│  │   Ask Buzz │ Trust │ Safety │ Agency │ Society │           │
│  └───────────────────────────────────────────────┘           │
│       │            │            │            │                 │
│  ┌────┴────────────┴────────────┴────────────┴────┐         │
│  │              DATA GRAPH ENGINE                   │         │
│  │  Trust │ Safety │ Commerce │ Movement │ Social  │         │
│  └───────────────────────────────────────────────┘         │
│       │            │            │            │                 │
└───────┼────────────┼────────────┼────────────┼─────────────────┘
        │            │            │            │
    ┌───┴───┐    ┌───┴───┐    ┌───┴───┐    ┌───┴───┐
    │ RABTUL │    │  REZ  │    │ BUZZ  │    │ External│
    │Platform│    │ Intel │    │ LOCAL │    │  APIs  │
    └────────┘    └───────┘    └───────┘    └─────────┘
```

---

## City OS Services

### Core City OS (Ports 4015-4019)

| Service | Port | Description |
|---------|------|-------------|
| [buzzlocal-ask-service](buzzlocal-ask-service/) | 4015 | Ask Buzz AI - Local Q&A engine |
| [buzzlocal-trust-service](buzzlocal-trust-service/) | 4016 | Trust scores, badges, verification |
| [buzzlocal-safety-service](buzzlocal-safety-service/) | 4017 | Safety alerts, SOS, credibility |
| [buzzlocal-agency-service](buzzlocal-agency-service/) | 4018 | BBMP, metro, weather webhooks |
| [buzzlocal-society-service](buzzlocal-society-service/) | 4019 | Apartments, announcements, buy/sell |

### Existing Services (Ports 4000-4014)

| Service | Port | Description |
|---------|------|-------------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map |
| buzzlocal-community-service | 4004 | Communities, groups |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-intelligence-service | 4010 | AI intelligence |
| buzzlocal-notification-service | 4011 | Push notifications |
| buzzlocal-realtime-service | 4012 | WebSocket updates |
| buzzlocal-weather-service | 4014 | Weather data |

---

## Features

### 1. Ask Buzz - "ChatGPT for Local Life"

**What it does:** Natural language queries for all local information

**User queries:**
- "Best biryani near Koramangala?"
- "Safe route to Indiranagar?"
- "24hr pharmacy nearby?"
- "Networking events tonight?"

**How it works:**
1. User submits query
2. Intent classification routes to category
3. AI generates response using:
   - REZ Mind patterns
   - Expert Services (health, retail, etc.)
   - Community answers
4. Trust-based answer prioritization
5. Follow-up suggestions

**API:** `POST /api/ask/query`

---

### 2. Trust & Reputation System

**Trust Levels:**
| Level | Score | Badge | Abilities |
|-------|-------|-------|-----------|
| New | 0-49 | 🟢 | Basic features |
| Verified | 50-99 | ✅ | Can post, comment |
| Trusted | 100-249 | ⭐ | Can verify alerts |
| Expert | 250-499 | 🏆 | Featured answers |
| Guardian | 500-999 | 🛡️ | Safety authority |
| Legend | 1000+ | 👑 | Community leader |

**Verification Methods:**
- Phone (+10 points)
- Email (+5 points)
- Address (+25 points)
- Society (+30 points)
- ID verification (+20 points)

**API:** `GET /api/trust/score/:userId`

---

### 3. REZ Safe - Safety Infrastructure

**Features:**
- Safety score for areas (0-100)
- SOS button with trusted circle notification
- Safety alerts with credibility scoring
- Women safety mode
- Emergency contacts

**Alert Types:**
- Suspicious activity
- Road safety
- Crime
- Natural hazard
- Traffic
- Infrastructure

**Credibility System:**
```
Submit Alert → AI Check → Community Vote → Credibility Score
```

**API:** `POST /api/safety/sos`

---

### 4. Public Agency Integration

**Supported Agencies:**
| Agency | Alerts | Integration |
|-------|--------|-------------|
| BBMP | Road closures, garbage | Webhook |
| Metro (BMRC) | Delays, station updates | API |
| Traffic Police | Accidents, diversions | Webhook |
| IMD | Weather warnings | API |
| BESCOM | Power outages | API |
| BWSSB | Water supply | API |

**Cron Jobs:**
- Metro updates: Every 5 minutes
- Weather alerts: Every 15 minutes
- BESCOM updates: Every 30 minutes

**API:** `GET /api/alerts/public`

---

### 5. Society OS - Apartment Infrastructure

**India-Specific Features:**
- Announcements from admins
- Visitor management
- Facility booking
- Buy/sell within society
- Maintenance requests
- Domestic help directory

**Society Types:**
- Apartment
- Gated Community
- Layout
- Campus

**Member Roles:**
- Resident
- Secretary
- Admin
- Security

**API:** `GET /api/societies/:id/announcements`

---

## Mobile App Screens

| Screen | File | Layer |
|--------|------|-------|
| Home Feed | `app/(main)/index.tsx` | Discover |
| **Ask Buzz** | `app/(main)/ask.tsx` | Ask |
| **REZ Safe** | `app/(main)/safe.tsx` | Safe |
| **Society** | `app/(main)/community.tsx` | Community |
| Explore | `app/(main)/explore.tsx` | Discover |
| Vibe Map | `app/(main)/vibe-map.tsx` | Discover |
| Profile | `app/(main)/profile.tsx` | Profile |
| Marketplace | `app/marketplace/index.tsx` | Commerce |
| Live Offers | `app/offers/index.tsx` | Commerce |
| Crisis Center | `app/crisis/index.tsx` | Safe |
| Services | `app/services/index.tsx` | Commerce |

---

## Environment Variables

### Required

```bash
# Service
PORT=4015
MONGODB_URI=mongodb://localhost:27017/buzzlocal-ask
NODE_ENV=development

# Internal Service Token
INTERNAL_SERVICE_TOKEN=your-internal-token

# RABTUL Services
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_GAMIFICATION_SERVICE_URL=http://localhost:4041
REZ_NOTIFICATIONS_SERVICE_URL=http://localhost:4011

# REZ Intelligence
REZ_INTENT_PREDICTOR_URL=http://localhost:4018
```

### Agency Webhooks

```bash
# BBMP Webhook
BBMP_WEBHOOK_SECRET=your-secret

# Metro Webhook
METRO_WEBHOOK_SECRET=your-secret

# Traffic Webhook
TRAFFIC_WEBHOOK_SECRET=your-secret

# Weather Webhook
WEATHER_WEBHOOK_SECRET=your-secret
```

---

## Deployment

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.city-os.yml up -d

# Check status
docker-compose -f docker-compose.city-os.yml ps

# View logs
docker-compose -f docker-compose.city-os.yml logs -f
```

### Quick Start Script

```bash
chmod +x start-city-os.sh
./start-city-os.sh
```

---

## Monitoring

### Health Checks

```bash
curl http://localhost:4015/health  # Ask
curl http://localhost:4016/health  # Trust
curl http://localhost:4017/health  # Safety
curl http://localhost:4018/health  # Agency
curl http://localhost:4019/health  # Society
```

### Metrics

| Service | Endpoint |
|--------|----------|
| buzzlocal-ask | `GET /metrics` |
| buzzlocal-safety | `GET /metrics` |
| buzzlocal-realtime | `GET /metrics` |

---

## Integration with REZ Ecosystem

### RABTUL Services Used

| Service | Purpose |
|---------|---------|
| `rez-auth-service` | Verification, address |
| `rez-wallet-service` | Coins, transactions |
| `rez-gamification-service` | Badges, leaderboards |
| `rez-notifications-service` | Push notifications |

### REZ Intelligence Used

| Service | Purpose |
|---------|---------|
| `intent-predictor` | Ask Buzz AI |
| `location-intelligence` | Neighborhood clustering |
| `unified-profile` | Trust calculation |
| `merchant-intelligence` | Services ranking |
| `health-expert` | Emergency resources |
| Expert Services | Domain answers |

---

## Coin Economy

### Earning Coins

| Action | Coins |
|--------|-------|
| Post (general) | 20 |
| Post (event) | 50 |
| Alert (verified) | 40 |
| Ask question | 0 |
| Answer (submitted) | 15 |
| Answer (marked helpful) | 25 |
| Safety alert (verified) | 30 |

### Spending Coins

| Action | Coins |
|--------|-------|
| Boost post visibility | 50 |
| Featured answer slot | 100 |
| Society admin badge | 200 |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Ask Buzz queries/day | 10,000+ |
| Safety alerts verified | >80% |
| Society retention | >90% |
| Verified users | >70% |
| Average trust score | >100 |

---

## Documentation

- [CITY-OS-SPEC.md](../REZ-Consumer/buzzlocal/CITY-OS-SPEC.md) - Complete specification
- [SPEC.md](../REZ-Consumer/buzzlocal/SPEC.md) - Original app spec
- [ECOSYSTEM-AUDIT-MASTER.md](../../ECOSYSTEM-AUDIT-MASTER.md) - Platform registry

---

## Support

For issues or questions:
1. Check service logs: `docker-compose logs -f <service-name>`
2. Verify environment variables
3. Check MongoDB connection
4. Contact the platform team
