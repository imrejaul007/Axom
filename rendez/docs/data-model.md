# Rendez — Data Model

## Schema Overview

```
Profile ──┬── Like (sent / received)
          ├── Match (user1 / user2)
          │     ├── MessageState ── Message[]
          │     ├── Gift[]
          │     ├── MeetupCheckin[]
          │     └── Reward[]
          ├── MeetupCheckin[]
          ├── Report (reporter / reported)
          ├── Block (blocker / blocked)
          └── FraudFlag[]
```

---

## Profile

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| rezUserId | String | Unique — REZ SSO user ID |
| phone | String | Unique — from REZ |
| name | String | |
| bio | String? | Max 300 chars |
| age | Int | |
| gender | Gender | MALE / FEMALE / NON_BINARY |
| interestedIn | Gender[] | Multi-select |
| intent | Intent | DATING / FRIENDSHIP / NETWORKING |
| city | String | Indexed |
| lat / lng | Float? | For nearby venue queries |
| photos | String[] | Cloudinary URLs |
| isVerified | Boolean | REZ identity verified |
| isActive | Boolean | false = soft-deleted |
| isSuspended | Boolean | true = 403 on all auth'd requests |
| profileScore | Float | Completeness %, shown in UI |
| rezSpendScore | Float | Weighted from REZ transaction history |

**Indexes:** `city`, `rezUserId`, `(isActive, city)`

---

## Match

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| user1Id / user2Id | String | FK → Profile |
| intentType | Intent | |
| status | MatchStatus | ACTIVE / ARCHIVED / UNMATCHED / BLOCKED |

**Unique:** `(user1Id, user2Id)`

---

## MessageState (per match)

Tracks the chat state machine. One record per match.

| Field | Type | Notes |
|-------|------|-------|
| state | ChatState | See state machine below |
| freeMessageUsedBy | String? | Profile ID of who used the free message |
| giftUnlockCount | Int | Number of accepted gifts |
| expiresAt | DateTime? | Used by match-expiry worker |

### ChatState values
```
MATCHED → FREE_MSG_SENT → AWAITING_REPLY → LOCKED → GIFT_PENDING → GIFT_UNLOCKED → OPEN
```

---

## Message

| Field | Type | Notes |
|-------|------|-------|
| matchId | String | For real-time broadcast room lookup |
| stateId | String | FK → MessageState |
| senderId | String | FK → Profile |
| content | String | Max 1000 chars |
| type | MessageType | FREE / GIFT_UNLOCKED / OPEN_CHAT |
| read | Boolean | false by default, set by read_receipt |
| flagged | Boolean | Moderation flag |

**Partial index:** `(read=false)` for efficient unread count queries

---

## Gift

| Field | Type | Notes |
|-------|------|-------|
| giftType | GiftType | COIN / MERCHANT_VOUCHER |
| amountPaise | Int | Amount in paise (1 INR = 100 paise) |
| rezHoldId | String? | REZ wallet hold reference |
| rezVoucherId | String? | REZ voucher reference (on accept) |
| status | GiftStatus | PENDING / ACCEPTED / REJECTED / REDEEMED / EXPIRED / CANCELLED |
| messageUnlocked | Boolean | Whether this gift unlocked the chat |
| attemptNumber | Int | 1 = 1× price, 2 = 1.5×, 3+ = 2× |
| expiresAt | DateTime | 48 hours from creation |

---

## MeetupCheckin

| Field | Type | Notes |
|-------|------|-------|
| matchId | String | FK → Match |
| bookingId | String | REZ booking reference |
| rezMerchantId | String | REZ venue ID |
| userId | String | FK → Profile |
| validationMethod | ValidationMethod | QR only |

**Unique:** `(matchId, userId)` — prevents double check-in

---

## Reward

| Field | Type | Notes |
|-------|------|-------|
| matchId / bookingId | String | Composite unique — one reward per meetup |
| user1Id / user2Id | String | Both users receive coins |
| status | RewardStatus | PENDING / TRIGGERED / FAILED |
| rezRewardRef | String? | REZ reward transaction reference |
| triggeredAt | DateTime? | When REZ confirmed coins sent |

---

## Enums

```typescript
enum Gender       { MALE, FEMALE, NON_BINARY }
enum Intent       { DATING, FRIENDSHIP, NETWORKING }
enum MatchStatus  { ACTIVE, ARCHIVED, UNMATCHED, BLOCKED }
enum ChatState    { MATCHED, FREE_MSG_SENT, AWAITING_REPLY, LOCKED, GIFT_PENDING, GIFT_UNLOCKED, OPEN }
enum MessageType  { FREE, GIFT_UNLOCKED, OPEN_CHAT }
enum GiftType     { COIN, MERCHANT_VOUCHER }
enum GiftStatus   { PENDING, ACCEPTED, REJECTED, REDEEMED, EXPIRED, CANCELLED }
enum RewardStatus { PENDING, TRIGGERED, FAILED }
enum ReportReason { HARASSMENT, FAKE_PROFILE, SPAM, INAPPROPRIATE_CONTENT, SCAM, OTHER }
enum ReportStatus { PENDING, REVIEWED, ACTION_TAKEN, DISMISSED }
enum FraudType    { GIFT_SPAM, REWARD_FARMING, MULTIPLE_ACCOUNTS, FAKE_CHECKIN }
```

---

## Redis Keys

| Key pattern | Value | TTL |
|-------------|-------|-----|
| `fcm:token:{userId}` | FCM device token | 90 days |
| `notif:prefs:{userId}` | JSON notification preferences | 1 year |
| `booking:{bookingId}` | JSON booking data | 48 hours |
| `rate:gift_pair:{senderId}:{receiverId}` | Counter | 5 minutes |
