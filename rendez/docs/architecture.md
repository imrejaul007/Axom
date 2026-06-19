# Rendez — Architecture

## Overview

Rendez is a **standalone** app with its own database and backend. REZ is a **partner API only** — Rendez calls REZ for auth, wallet, gifts, merchant bookings, and rewards, but owns all its own state.

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Devices                              │
│   ┌─────────────────────┐        ┌──────────────────────────┐   │
│   │  Rendez iOS/Android  │        │   Rendez Admin (browser) │   │
│   │  (Expo / RN)         │        │   (Next.js on Vercel)    │   │
│   └──────────┬───────────┘        └──────────────┬───────────┘   │
└──────────────┼────────────────────────────────────┼──────────────┘
               │ HTTPS + WSS                        │ HTTPS + Bearer token
               ▼                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    rendez-backend (Render / Singapore)           │
│                                                                  │
│  Express.js  ──  Socket.io (same port)                           │
│  JWT auth middleware                                             │
│  Rate limiters (default / gift / giftPair / auth)               │
│  Admin Bearer token guard                                        │
│                                                                  │
│  Routes: auth, profile, discover, matches, messaging,            │
│          gifts, meetup, safety, upload, wallet, devices,         │
│          webhooks/rez, admin                                     │
│                                                                  │
│  Services: Match, Gift, Meetup, Messaging, Notification,        │
│            Discovery, Fraud, Moderation, Reward,                │
│            Cloudinary                                            │
│                                                                  │
│  BullMQ workers → Redis (match expiry, fraud sweeps)            │
│                                                                  │
│  Prisma ORM ──► PostgreSQL 16 (Render managed)                  │
│  ioredis    ──► Redis 7      (Render managed)                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST (API key + HMAC)
                             ▼
              ┌──────────────────────────────┐
              │   REZ Partner API            │
              │   /partner/v1/...            │
              │                              │
              │  • auth/verify (SSO)         │
              │  • wallet/hold/release       │
              │  • gifts/catalog             │
              │  • merchants/nearby          │
              │  • bookings                  │
              │  • rewards/trigger           │
              └──────────────────────────────┘
              Inbound webhooks: gift.accepted, booking.confirmed,
                               reward.status (HMAC-verified)
```

## REZ Integration Boundary

All REZ calls go through `src/middleware/partnerAudit.ts` which logs every outbound call (endpoint, status, latency, userId) to structured logs. Rendez **never** stores REZ wallet balances — it reads live from `GET /partner/v1/wallet/balance`.

### Partner API key security
- `REZ_API_KEY` stored as env var, never in code
- `REZ_WEBHOOK_SECRET` used for HMAC-SHA256 verification on every inbound webhook
- All outbound calls use `Authorization: ApiKey <REZ_API_KEY>` header

## Real-time (Socket.io)

Socket.io shares the same HTTP port as Express (via `http.createServer(app)`).

```
Client connects → JWT verified on handshake (middleware)
                → Profile looked up, stored as socket.data.user
                → socket.join(`match:${matchId}`) on join_match event

Events (client → server):
  join_match    { matchId }
  send_message  { matchId, content, type }
  typing        { matchId }
  stop_typing   { matchId }
  read_receipt  { matchId, messageId }

Events (server → client, broadcast to match room):
  new_message    { id, senderId, content, type, createdAt }
  user_typing    { userId }
  user_stopped   { userId }
  message_read   { messageId, readBy }
```

## Messaging State Machine

```
MATCHED
  │
  │ User A sends first message
  ▼
FREE_MSG_SENT
  │
  │ User B reads (not replied yet)
  ▼
AWAITING_REPLY
  │
  │ User B replies
  ▼
LOCKED  ◄── default state after free exchange
  │
  │ Either user sends a gift (GiftStatus=PENDING)
  ▼
GIFT_PENDING
  │
  │ Gift accepted
  ▼
GIFT_UNLOCKED  (one gift cycle complete)
  │
  │ Additional gift accepted (giftUnlockCount >= 1 = OPEN)
  ▼
OPEN  ← free messaging, no more gift requirement
```

## Meetup & Reward Flow

```
1. Match books a REZ venue  POST /meetup/book
   └─ calls REZ /partner/v1/bookings → returns bookingId
   └─ bookingId cached in Redis (TTL 48h)

2. Both users QR-scan on arrival  POST /meetup/checkin
   └─ QR payload = { bookingId, rezMerchantId }
   └─ MeetupCheckin record created (unique per matchId+userId)
   └─ If checkinCount == 2 → trigger reward (async)

3. Reward trigger (fire-and-forget)
   └─ Validates: match ≥ 7 days old, no reward for this pair in 90 days
   └─ Calls REZ /partner/v1/rewards/trigger
   └─ Reward.status → TRIGGERED (or FAILED)
   └─ FCM push to both users
```

## Fraud Prevention

| Gate | Mechanism |
|------|-----------|
| Identity | REZ SSO — all users identity-verified by REZ |
| Gift spam | 5/day global cap + 1/pair/5min rate limit |
| Gift farming | Max 3 gifts/day to same receiver |
| Reward farming | 7-day match minimum, 90-day per-pair cooldown |
| Fake check-in | QR-only (no GPS), both must scan within 30 min |
| Multiple accounts | `rezUserId` unique constraint on Profile |
| Suspension | `isSuspended` checked on every authenticated request → 403 |

## Background Workers (BullMQ)

Three recurring jobs run via BullMQ backed by Redis. On server restart, existing repeatable jobs are removed before re-adding to prevent duplicate accumulation.

| Worker | Queue | Schedule | What it does |
|--------|-------|----------|--------------|
| `giftExpiryWorker` | `gift-expiry` | Every **5 min** | Finds `Gift` records with `status=PENDING` and `expiresAt ≤ now`. For each: refunds the REZ wallet hold via `rezWallet.refundHold`, marks gift `EXPIRED`, calls `MessagingService.revertToLocked` to unblock the chat state. Errors per-gift are caught individually so one failure doesn't abort the batch. |
| `matchExpiryWorker` | `match-expiry` | Every **30 min** | Finds `MessageState` rows in `FREE_MSG_SENT` or `AWAITING_REPLY` with `expiresAt ≤ now`. Moves them to `LOCKED`, re-gating the conversation behind a gift. |
| `catalogCacheWorker` | `catalog-cache` | Every **6 hours** | Warms the Redis gift catalog cache for all active cities (hardcoded: `mumbai`, `delhi`, `bangalore`). Calls `GiftService.getCatalog()` once globally + once per city. Prevents cold-cache latency spikes on `GET /gifts/catalog`. |

**Failure handling:** Each worker logs errors per-item but does not stop the run. BullMQ `removeOnComplete: 10` keeps only the last 10 completed job records in Redis. No retry configured — next scheduled run naturally retries.

**Graceful shutdown:** Workers receive a `SIGTERM` from Render and drain in-flight jobs before exiting. No explicit `worker.close()` call needed when using BullMQ defaults.

---

## FCM Deep Link Payload Types

```typescript
type DeepLinkPayload =
  | { type: 'match';   matchId: string; matchName: string }
  | { type: 'message'; matchId: string; matchName: string }
  | { type: 'gift';    giftId: string }
  | { type: 'meetup';  matchId: string }
  | { type: 'reward' }
```

Each FCM notification's `data` object uses exactly these fields so `useDeepLink` routes taps to the correct screen.
