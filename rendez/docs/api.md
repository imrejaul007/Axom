# Rendez — REST API Reference

Base URL: `https://rendez-backend.onrender.com`

All authenticated endpoints require:
```
Authorization: Bearer <rendez_jwt>
```

---

## Auth

### POST /api/v1/auth/verify
Validate a REZ SSO token and issue a Rendez JWT.

**Rate limit:** 3 requests/hour per IP

**Body:**
```json
{ "rezToken": "string" }
```

**Response:**
```json
{
  "token": "eyJ...",
  "hasProfile": true,
  "profile": { "id": "...", "name": "...", "photos": ["..."] }
}
```

---

## Profile

### POST /api/v1/profile
Create profile (first-time setup after auth).

**Body:** `name`, `bio?`, `age`, `gender`, `interestedIn`, `intent`, `city`, `lat?`, `lng?`, `photos?`

### GET /api/v1/profile/me
Returns full authenticated user profile.

### PATCH /api/v1/profile/me
Update profile fields. Allowed: `name`, `bio`, `photos`, `city`, `lat`, `lng`, `intent`, `interestedIn`.

### DELETE /api/v1/profile/me
Soft-delete — anonymises PII, sets `isActive=false`. Preserves relational data (matches, gifts, meetups) for audit.

---

## Discover

### GET /api/v1/discover
Returns paginated candidate profiles for the swipe deck.

**Query:** `limit?` (default 20), `city?`

**Response:** `{ profiles: Profile[], total: number }`

### POST /api/v1/discover/like
Like a profile. Returns `{ matched: true, matchId }` if mutual.

**Body:** `{ "toUserId": "string" }`

### POST /api/v1/discover/pass
Pass on a profile.

**Body:** `{ "toUserId": "string" }`

---

## Matches

### GET /api/v1/matches
Returns all active matches with last message preview and unread count. Sorted unread-first.

**Response:**
```json
[{
  "id": "match_id",
  "user": { "id": "...", "name": "...", "photos": ["..."] },
  "state": "OPEN",
  "lastMessage": { "content": "...", "senderId": "...", "createdAt": "..." },
  "unreadCount": 3,
  "createdAt": "..."
}]
```

### GET /api/v1/matches/:matchId
Single match detail.

### DELETE /api/v1/matches/:matchId/unmatch
Unmatch (sets status to UNMATCHED).

---

## Messaging

### GET /api/v1/matches/:matchId/messages
Returns paginated message history.

**Query:** `cursor?` (last message ID), `limit?` (default 30)

### POST /api/v1/matches/:matchId/messages
Send a message. Validates messaging state machine.

**Body:**
```json
{
  "content": "string",
  "type": "FREE | GIFT_UNLOCKED | OPEN_CHAT"
}
```

**Error codes:**
- `CHAT_LOCKED` — state machine requires a gift before next message
- `CHAT_STATE_INVALID` — wrong type for current state

---

## Gifts

### GET /api/v1/gifts/catalog
Returns REZ gift catalog items.

**Query:** `city?`

### POST /api/v1/gifts/send
Send a gift to unlock conversation.

**Rate limits:** 5/day per sender; 1/pair/5min

**Body:**
```json
{
  "receiverId": "string",
  "matchId": "string",
  "giftType": "COIN | MERCHANT_VOUCHER",
  "amountPaise": 50000,
  "rezCatalogItemId": "string?",
  "message": "string?"
}
```

**Error codes:**
- `DAILY_GIFT_LIMIT` — 5 gifts/day cap hit
- `GIFT_TOO_SOON` — pair rate limit (1/5min)
- `INSUFFICIENT_BALANCE`
- `ALREADY_OPEN` — chat already unlocked

### POST /api/v1/gifts/:giftId/accept
Accept a gift. Releases REZ wallet hold. Unlocks chat.

### POST /api/v1/gifts/:giftId/reject
Reject a gift. Refunds sender's REZ wallet.

### GET /api/v1/gifts/inbox
Returns received gifts pending action.

### GET /api/v1/gifts/sent
Returns sent gifts.

---

## Meetup

### GET /api/v1/meetup/nearby
Returns nearby REZ-verified venues.

**Query:** `lat` (required), `lng` (required), `radius?` (km, default 10)

### POST /api/v1/meetup/book
Book a REZ venue for a date.

**Body:**
```json
{
  "matchId": "string",
  "merchantId": "string",
  "date": "2026-04-15",
  "partySize": 2
}
```

**Response:** `{ "bookingId": "...", "merchantName": "...", "confirmationCode": "..." }`

### POST /api/v1/meetup/checkin
QR check-in at venue. Both users must scan within 30 minutes.

**Body:**
```json
{
  "matchId": "string",
  "bookingId": "string",
  "rezMerchantId": "string"
}
```

**Response:**
```json
{
  "myCheckedIn": true,
  "partnerCheckedIn": false,
  "bothCheckedIn": false,
  "rewardStatus": "PENDING"
}
```

### GET /api/v1/meetup/status/:matchId
Poll meetup status (used during waiting state).

---

## Wallet

### GET /api/v1/wallet/balance
Returns REZ wallet balance for authenticated user.

**Response:** `{ "balancePaise": 125000, "rezCoins": 1250 }`

---

## Safety

### POST /api/v1/report
Report a user.

**Body:** `{ "reportedId": "string", "reason": "HARASSMENT|FAKE_PROFILE|SPAM|INAPPROPRIATE_CONTENT|SCAM|OTHER", "detail": "string?" }`

### POST /api/v1/block
Block a user. Hides them from discover + messages.

**Body:** `{ "blockedId": "string" }`

---

## Devices

### POST /api/v1/devices/token
Register FCM push token.

**Body:** `{ "token": "string", "platform": "ios|android" }`

### PATCH /api/v1/devices/preferences
Update notification preferences (stored in Redis, TTL 1 year).

**Body:**
```json
{
  "matches": true,
  "messages": true,
  "gifts": true,
  "meetups": true,
  "rewards": true
}
```

---

## Upload

### POST /api/v1/upload/photo
Upload a profile photo to Cloudinary.

**Body:** `multipart/form-data` — field name `photo`

**Response:** `{ "url": "https://res.cloudinary.com/..." }`

---

## Admin API

All admin endpoints require:
```
Authorization: Bearer <ADMIN_API_KEY>
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard KPI numbers |
| GET | `/admin/stats/timeseries?days=7` | Daily counts (matches/gifts/meetups/users) up to 30d |
| GET | `/admin/users?city=&search=&isVerified=&isActive=` | User list (max 100) |
| PATCH | `/admin/users/:id/suspend` | Suspend user |
| PATCH | `/admin/users/:id/unsuspend` | Unsuspend user |
| GET | `/admin/reports?status=PENDING` | Moderation queue |
| PATCH | `/admin/reports/:id` | Resolve report `{ status, reviewedBy }` |
| GET | `/admin/fraud?type=&resolved=` | Fraud flag list |
| PATCH | `/admin/fraud/:id/resolve` | Mark flag resolved |
| GET | `/admin/gifts?status=&type=` | Gift list (max 500) |
| GET | `/admin/meetups?status=` | Meetup list with check-in + reward data |

---

## Webhooks (Inbound from REZ)

All webhook routes are under `POST /webhooks/rez/...`

**Verified** with `X-Rendez-Signature: sha256=<hmac>` header using `REZ_WEBHOOK_SECRET` (HMAC-SHA256 of raw request body). Any request failing signature verification returns `401`.

### POST /webhooks/rez/gift-redeemed
Fired when a user physically redeems a gift voucher at a REZ merchant.

**Payload:**
```json
{ "voucher_id": "vchr_xxx", "redeemed_at": "2026-01-15T14:30:00Z" }
```
**Action:** Updates `Gift.status → REDEEMED` by `rezVoucherId`.

---

### POST /webhooks/rez/gift-expired
Fired when REZ expires an unclaimed voucher (REZ handles the refund on their end).

**Payload:**
```json
{ "voucher_id": "vchr_xxx" }
```
**Action:** Updates `Gift.status → EXPIRED`. No wallet action needed — refund already processed by REZ.

---

### POST /webhooks/rez/payment-completed
Fired when a matched pair completes a payment at a REZ merchant booking. Triggers meetup reward if both users have checked in.

**Payload:**
```json
{ "booking_id": "bkg_xxx", "amount_paise": 50000, "merchant_id": "mch_xxx" }
```
**Action:** Looks up Reward by `bookingId`. If both `MeetupCheckin` records exist → calls `RewardService.triggerMeetupReward`.

---

### POST /webhooks/rez/reward-triggered
Fired after REZ successfully credits the reward to both users' wallets.

**Payload:**
```json
{ "reward_id": "rwd_xxx", "user_ids": ["rez_u1", "rez_u2"], "amount_paise": 10000 }
```
**Action:** Updates `Reward.status → TRIGGERED`, sets `triggeredAt`. FCM notification sent to both users via `NotificationService`.

---

## Error Format

All errors return:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Common HTTP codes:
- `400` — validation error
- `401` — missing/invalid JWT
- `403` — suspended account or forbidden
- `404` — resource not found
- `429` — rate limit exceeded
- `500` — internal server error (Sentry-captured)
