# BuzzLocal Backend Services

**Complete backend for BuzzLocal - Life OS for local communities.**

---

## Services (10 microservices)

| Port | Service | Description |
|------|---------|-------------|
| 4019 | SocietyOS | MyGate killer - visitor management, QR passes |
| 4017 | SafetyOS | Alerts, SOS, area safety |
| 4015 | Ask Service | AI-powered Q&A |
| 4018 | Agency Service | BBMP, metro, weather alerts |
| 4016 | Trust Service | Trust scoring |
| 4004 | Community | Feeds, groups |
| 4000 | Feed | Posts |
| 4020 | HousingOS | Rentals, PGs, flatmates |
| 4021 | PropertyOS | Landlord dashboard |
| 4022 | RentFinanceOS | Zero deposit, credit score |

---

## Quick Start

```bash
# Start all services
./scripts/start-buzzlocal.sh

# Or individually
cd buzzlocal-society-service && npm start
```

## Docker

```bash
docker-compose up -d
```

---

## API Examples

### SocietyOS - Visitor Management

```bash
# Create society
curl -X POST http://localhost:4019/api/societies \
  -H "x-user-id: user123" \
  -d '{"name":"Test Society","type":"apartment",...}'

# Add visitor
curl -X POST http://localhost:4019/api/societies/:id/visitors \
  -H "x-user-id: user123" \
  -d '{"visitorName":"John","purpose":"family","expectedDate":"2026-07-03"}'

# Generate QR pass
curl -X POST http://localhost:4019/api/societies/:id/visitors/:vid/generate-qr

# Guard verifies QR
curl -X POST http://localhost:4019/api/societies/:id/visitors/verify-qr \
  -d '{"qrToken":"<token>"}'
```

---

## Architecture

BuzzLocal backend consists of 10 microservices that power the mobile app:

| Service | Port | Description |
|---------|------|-------------|
| [buzzlocal-feed-service](buzzlocal-feed-service/) | 4000 | Posts, feed, AI cards, coin rewards |
| [buzzlocal-vibe-service](buzzlocal-vibe-service/) | 4003 | Vibe areas, check-ins, crowd heatmap |
| [buzzlocal-community-service](buzzlocal-community-service/) | 4004 | Communities, group posts, members |
| [z-events-service](z-events-service/) | 4008 | Events, ticketing, QR check-in |
| [buzzlocal-intelligence-service](buzzlocal-intelligence-service/) | 4010 | AI intelligence, REZ Mind integration |
| [buzzlocal-notification-service](buzzlocal-notification-service/) | 4011 | Push notifications via Expo |
| [buzzlocal-realtime-service](buzzlocal-realtime-service/) | 4012 | WebSocket real-time updates |
| [buzzlocal-payment-service](buzzlocal-payment-service/) | 4013 | Payments via Razorpay |
| [buzzlocal-weather-service](buzzlocal-weather-service/) | 4014 | Weather data, insights, feeds REZ Mind |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BuzzLocal App                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Feed Service  │   │  Vibe Service │   │Events Service │
│    4000      │   │    4003      │   │    4008      │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│Community Svc  │   │Intelligence Svc│   │Payment Service│
│    4004      │   │    4010      │   │    4013      │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│Notification Svc│   │ REZ Intelligence│
│    4011      │   │    Platform    │
└───────────────┘   └───────────────┘
```

---

## Quick Start

### Install & Run All Services

```bash
# Option 1: Docker (Recommended)
docker compose up -d

# Option 2: Individual services
for svc in buzzlocal-feed buzzlocal-vibe buzzlocal-community \
           z-events buzzlocal-intelligence buzzlocal-notification \
           buzzlocal-realtime buzzlocal-payment; do
    cd $svc && npm install && npm run dev &
done
```

### Check Status

```bash
# Health check all services
curl http://localhost:4000/health  # Feed
curl http://localhost:4003/health  # Vibe
curl http://localhost:4004/health  # Community
curl http://localhost:4008/health  # Events
curl http://localhost:4010/health  # Intelligence
curl http://localhost:4011/health  # Notifications
curl http://localhost:4012/health  # Realtime
curl http://localhost:4013/health  # Payment

# Or use the status script
./status.sh
```

---

## Service Details

### 1. Feed Service (4000)

**Posts, feed, AI cards, coin rewards**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | Get personalized feed |
| POST | `/posts` | Create post |
| GET | `/posts/:id` | Get single post |
| POST | `/posts/:id/like` | Like/unlike post |
| POST | `/posts/:id/save` | Save/unsave post |
| DELETE | `/posts/:id` | Delete post |
| GET | `/feed/ai-cards` | Get AI cards |

#### Post Types
- `general` - Text, media, location, tags
- `event` - Event information
- `alert` - Local alerts (crime, traffic, etc.)
- `place` - Place discovery
- `deal` - Deals and offers
- `poll` - Community polls

#### Coin Rewards
| Type | Coins |
|------|-------|
| general | 20 |
| event | 50 |
| alert | 40 |
| place | 30 |
| deal | 25 |
| poll | 15 |

---

### 2. Vibe Service (4003)

**Vibe areas, check-ins, crowd heatmap**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vibe/areas` | Get nearby vibe areas |
| GET | `/vibe/heatmap` | Get crowd heatmap |
| POST | `/checkin` | Check in to location |
| POST | `/checkin/out` | Check out |
| GET | `/checkin/history` | Get check-in history |

#### Vibe Areas
- Tracked by location (lat/lng)
- Mood types: `quiet`, `chill`, `busy`, `party`
- Crowd levels: 1-5
- Updated in real-time via WebSocket

---

### 3. Community Service (4004)

**Communities, group posts, members**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/communities` | List communities |
| POST | `/communities` | Create community |
| GET | `/communities/:id` | Get community |
| POST | `/communities/:id/join` | Join community |
| POST | `/communities/:id/leave` | Leave community |
| GET | `/communities/:id/posts` | Get community posts |
| POST | `/communities/:id/posts` | Create post in community |

#### Community Types
- `area` - Neighborhood, locality
- `interest` - Hobby, passion, topic
- `apartment` - Residential complex
- `campus` - College, university

---

### 4. Events Service (4008)

**Events, ticketing, QR check-in**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events |
| POST | `/events` | Create event |
| GET | `/events/:id` | Get event |
| POST | `/events/:id/interest` | Express interest |
| POST | `/tickets` | Purchase ticket |
| POST | `/tickets/checkin` | Check in with ticket |
| GET | `/tickets/user` | Get user's tickets |

#### Event Categories
- music, tech, food, sports, arts
- networking, wellness, education
- gaming, nightlife, community

---

### 5. Intelligence Service (4010)

**AI intelligence, REZ Mind integration**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/cards` | Get AI cards for feed |
| GET | `/ai/feed` | Get personalized recommendations |
| GET | `/ai/mood` | Predict area mood |
| GET | `/ai/trending` | Get trending topics |
| POST | `/ai/track` | Track user action |

#### REZ Intelligence Integration
- Event Platform (4008)
- Taste Profile (4041)
- Demand Forecast (4042)
- Autonomous Agents (4062)

---

### 6. Notification Service (4011)

**Push notifications via Expo**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/register` | Register push token |
| GET | `/notifications` | Get notifications |
| POST | `/notifications/send` | Send notification |
| PUT | `/notifications/:id/read` | Mark as read |
| DELETE | `/notifications/:id` | Delete notification |

#### Notification Categories
- `post` - New posts, likes, comments
- `event` - Event reminders, updates
- `community` - Community activity
- `alert` - Local alerts
- `reward` - Coin rewards, badges
- `system` - System messages

---

### 7. Realtime Service (4012)

**WebSocket real-time updates**

#### Socket Events

| Event | Direction | Description |
|-------|----------|-------------|
| `new_post` | Server → Client | New post in area |
| `new_checkin` | Server → Client | Check-in nearby |
| `mood_change` | Server → Client | Area mood updated |
| `event_reminder` | Server → Client | Event starting soon |
| `subscribe` | Client → Server | Subscribe to area |
| `location` | Client → Server | Update location |

#### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emit` | Emit event to room/area |
| GET | `/health` | Health check |
| GET | `/metrics` | Connection metrics |

---

### 8. Payment Service (4013)

**Payments via Razorpay**

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/orders` | Create order |
| POST | `/payments/verify` | Verify payment |
| GET | `/payments/orders` | Get user's orders |
| GET | `/payments/orders/:id` | Get order details |
| POST | `/payments/orders/:id/cancel` | Cancel order |
| POST | `/payments/orders/:id/refund` | Request refund |
| POST | `/payments/webhook` | Razorpay webhook |

#### Order Types
- `event_ticket` - Event ticket purchase
- `deal_purchase` - Deal redemption
- `subscription` - Premium features

---

## Environment Variables

Each service requires `.env` file. Copy from `.env.example`:

```bash
# Service
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/buzzlocal

# Internal Service Token (for service-to-service auth)
INTERNAL_SERVICE_TOKEN=your-token-here

# External Services
WALLET_SERVICE_URL=http://localhost:4002
MIND_SERVICE_URL=http://localhost:4005
```

### Service-Specific Variables

**Payment Service:**
```bash
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

**Notification Service:**
```bash
EXPO_ACCESS_TOKEN=your-expo-token
```

**Intelligence Service:**
```bash
REZ_EVENT_PLATFORM_URL=http://localhost:4008
REZ_UNIFIED_RECOMMENDATIONS_URL=http://localhost:4090
REZ_TASTE_PROFILE_URL=http://localhost:4041
```

---

## Testing

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

## Deployment

### Docker Compose

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Render

```bash
# Deploy all services
render deploy

# Or use render.yaml
render deploy --config render.yaml
```

### Scripts

| Script | Purpose |
|--------|---------|
| `deploy.sh` | Deploy all services |
| `start-all.sh` | Start all services locally |
| `status.sh` | Check service status |

---

## Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost:4000/health
curl http://localhost:4003/health
curl http://localhost:4004/health
curl http://localhost:4008/health
curl http://localhost:4010/health
curl http://localhost:4011/health
curl http://localhost:4012/health
curl http://localhost:4013/health
```

### Logs

```bash
# View logs for a service
docker compose logs -f buzzlocal-feed

# View all logs
docker compose logs -f
```

---

## Related

- [buzzlocal-app](../buzzlocal-app/) - Mobile app
- [REZ-Intelligence](../REZ-Intelligence/) - AI platform
- [RABTUL-Technologies](../RABTUL-Technologies/) - Other services
