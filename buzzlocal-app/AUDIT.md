# BuzzLocal - Complete Audit

**Date:** May 14, 2026
**Status:** REVIEWED

---

## Overview

| Item | Details |
|------|---------|
| **App** | BuzzLocal - Hyperlocal Social + Discovery |
| **Type** | React Native (Expo SDK 53) |
| **Screens** | 18 |
| **Backend** | 9 microservices |
| **Port Range** | 4000-4014 |

---

## App Screens (18)

| # | Screen | File | Description |
|---|--------|------|-------------|
| 1 | Home Feed | `app/(main)/index.tsx` | Feed with AI cards |
| 2 | Explore | `app/(main)/explore.tsx` | Search & discover |
| 3 | Events | `app/(main)/events.tsx` | Event discovery |
| 4 | Event Detail | `app/event/[id].tsx` | Event info, RSVP |
| 5 | Create Event | `app/create-event.tsx` | Create event |
| 6 | Vibe Map | `app/(main)/vibe-map.tsx` | Crowd heatmap |
| 7 | Communities | `app/(main)/communities.tsx` | Groups |
| 8 | Community Detail | `app/community/[id].tsx` | Posts |
| 9 | Create Community | `app/create-community.tsx` | Create group |
| 10 | QR Check-in | `app/(main)/scan.tsx` | Ticket check-in |
| 11 | Weather | `app/(main)/weather.tsx` | Weather + alerts |
| 12 | Profile | `app/(main)/profile.tsx` | Badges, streaks |
| 13 | Creator Dashboard | `app/creator.tsx` | Analytics |
| 14 | Wallet | `app/wallet.tsx` | Coins |
| 15 | Notifications | `app/notifications.tsx` | Notifications |
| 16 | Create Post | `app/create.tsx` | 6 post types |
| 17 | Search | `app/search.tsx` | Global search |
| 18 | Settings | `app/settings.tsx` | Settings |

---

## Backend Services (9)

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Vibe areas, check-ins |
| buzzlocal-community-service | 4004 | Communities, members |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-intelligence-service | 4010 | AI, REZ Mind |
| buzzlocal-notification-service | 4011 | Push notifications |
| buzzlocal-realtime-service | 4012 | WebSocket |
| buzzlocal-payment-service | 4013 | Payments |
| buzzlocal-weather-service | 4014 | Weather data |

### Feed Service (4000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feed` | GET | Personalized feed |
| `/posts` | GET, POST | Posts |
| `/posts/:id` | GET, DELETE | Single post |
| `/posts/:id/like` | POST | Like/unlike |
| `/posts/:id/save` | POST | Save/unsave |
| `/feed/ai-cards` | GET | AI cards |

**Post Types:** general (20 coins), event (50), alert (40), place (30), deal (25), poll (15)

### Vibe Service (4003)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/vibe/areas` | GET | Nearby vibe areas |
| `/vibe/heatmap` | GET | Crowd heatmap |
| `/checkin` | POST | Check in |
| `/checkin/out` | POST | Check out |
| `/checkin/history` | GET | History |

**Vibe Types:** quiet, chill, busy, party

### Community Service (4004)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/communities` | GET, POST | List/Create |
| `/communities/:id` | GET | Details |
| `/communities/:id/join` | POST | Join |
| `/communities/:id/leave` | POST | Leave |
| `/communities/:id/posts` | GET, POST | Posts |

**Types:** area, interest, brand, event

### Events Service (4008)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | GET, POST | Events |
| `/events/:id` | GET | Details |
| `/events/:id/rsvp` | POST | RSVP |
| `/events/:id/ticket` | POST | Generate ticket |
| `/events/:id/checkin` | POST | QR check-in |

### Intelligence Service (4010)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/cards` | GET | AI cards |
| `/ai/feed` | GET | Personalized |
| `/ai/mood` | GET | Area mood |
| `/ai/trending` | GET | Trending |
| `/ai/track` | POST | Track action |

### Notification Service (4011)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notifications/register` | POST | Push token |
| `/notifications` | GET | List |
| `/notifications/send` | POST | Send |
| `/notifications/:id/read` | PUT | Mark read |

**Categories:** post, event, community, alert, reward, system

### Realtime Service (4012)

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_post` | Server→Client | New post |
| `new_checkin` | Server→Client | Check-in |
| `mood_change` | Server→Client | Mood update |
| `event_reminder` | Server→Client | Event soon |

### Payment Service (4013)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/initiate` | POST | Start payment |
| `/payments/verify` | POST | Verify |
| `/payments/history` | GET | History |
| `/payouts` | POST | Creator payouts |

### Weather Service (4014)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/weather` | GET | Current weather |
| `/weather/forecast` | GET | 7-day forecast |
| `/weather/aqi` | GET | Air quality |

---

## Features Summary

### Post Types (Coin Rewards)
| Type | Coins |
|------|-------|
| General | 20 |
| Event | 50 |
| Alert | 40 |
| Place | 30 |
| Deal | 25 |
| Poll | 15 |

### Weather
- Real-time weather
- Hourly & 7-day forecast
- Air quality index
- Weather alerts
- Post suggestions
- **Feeds REZ Mind**

### Gamification
- ReZ Coins
- Badges
- Streaks
- Leaderboards
- Creator analytics

---

## Integrations

### RABTUL Core
| Service | Purpose |
|---------|---------|
| rez-auth-service | Authentication |
| rez-wallet-service | Coins/transactions |

### REZ Intelligence
| Service | Purpose |
|---------|---------|
| REZ Mind | AI training |
| Event Platform | Event tracking |
| Taste Profile | Content taste |
| Demand Forecast | Predictions |
| Autonomous Agents | Automation |

---

## SECURITY AUDIT

### Issues Found

| Issue | Service | Severity |
|-------|---------|----------|
| Auth bypass - "allow all" | Feed Service | CRITICAL |
| No JWT verification | Feed Service | CRITICAL |
| No rate limiting | All services | HIGH |
| CORS not enforced | All services | MEDIUM |

### Critical Issue Details

**File:** `buzzlocal-feed-service/src/middleware/auth.ts`

```typescript
// For now, allow all requests (auth will be handled by API Gateway)
// In production, verify JWT token here
const userId = req.headers['x-user-id'] as string;
if (userId) {
  req.userId = userId;
}
next(); // ← ALWAYS ALLOWS
```

**Impact:** Anyone can post as any user by setting `x-user-id` header.

---

## FIXES REQUIRED

### 1. Secure Auth Middleware

```typescript
// FIX: Add proper JWT verification
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET required');

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const internalAuth = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  if (token === INTERNAL_TOKEN) {
    req.isInternalCall = true;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token required' });
  }

  const decoded = verifyToken(authHeader.substring(7));
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = decoded.id;
  next();
};
```

### 2. Add Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
```

### 3. Add CORS

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [],
  credentials: true,
}));
```

---

## RECOMMENDATIONS

| Priority | Action |
|----------|--------|
| CRITICAL | Fix auth middleware - add JWT verification |
| CRITICAL | Remove "allow all" comment |
| HIGH | Add rate limiting to all services |
| HIGH | Add CORS configuration |
| MEDIUM | Add audit logging |
| MEDIUM | Add input validation |
| LOW | Add request ID tracking |

---

## DOCUMENTATION

| Doc | Status |
|-----|--------|
| README.md | Complete |
| SPEC.md | Complete |
| CLAUDE.md | Complete |
| AUDIT.md | This file |

---

*Last Updated: May 14, 2026*
