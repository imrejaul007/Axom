# Changelog

---

## [1.1.0] — 2026-04-25

### Summary
BULLETPROOF audit — all CRITICAL/HIGH/MEDIUM/LOW issues resolved across backend, app, and admin. Coin credit flows hardened with idempotency, retry queues, DLQ, and status tracking. Prisma schema audited for indexes, cascade deletes, and soft deletes.

---

### Backend (`rendez-backend`)

#### BULLETPROOF — Coin Credit Hardening
- `PlanService.confirmAttendance`: full rewrite with Redis NX lock, atomic sponsor budget deduction, `CoinCreditStatus` tracking (PENDING → CREDITED/FAILED), retry queue on failure
- `sponsorCreditWorker`: BullMQ worker with 3-attempt exponential backoff, DLQ for persistently failing retries, idempotency via `attemptsMade`
- `rewardTriggerWorker`: sequential `creditMeetupBonus` awaits with per-participant idempotency keys; explicit try-catch (no silent swallow)
- `ReferralService.creditReferrerIfEligible`: idempotency key `referral:{newUserId}:{referrerId}`
- `rezWalletClient`: all 8 functions wrapped in try-catch with `log.error` + AppError re-throw
- `rezGiftClient`: all 5 functions wrapped in try-catch with `log.error` + AppError re-throw
- `rezRewardClient.triggerMeetupReward`: wrapped in try-catch with `log.error` + AppError re-throw

#### BULLETPROOF — Retry Queues
- `sponsorCreditQueue`: BullMQ queue with 3 attempts, exponential backoff (10s), DLQ on exhaustion
- `rewardTriggerQueue`: BullMQ queue with 3 attempts, exponential backoff (5s), DLQ on exhaustion

#### Bug Fixes
- `matchExpiryWorker`: re-throw from catch → BullMQ now retries failed state updates
- `planWorkers` (ghostDetectWorker, autoCancelWorker): re-throw from catch → BullMQ retries
- `DiscoveryService`: wrapped Redis `JSON.parse` in try-catch (fallback to cache miss on corrupt data)
- `rewardTriggerWorker`: wrapped FCM token `JSON.parse` in try-catch (null fallback on parse error)
- `PlanService`: `.catch(() => {})` on `viewsCount` increment → `log.error`
- `MatchService`: `.catch(() => {})` on match notifications → `log.error` (also added missing `log` import)
- `ExperienceCreditService`: `.catch(() => {})` on REZ webhook → `log.error` (also added missing `log` import)
- `admin.ts`: `.catch(() => {})` on fraudFlag creation → `log.error`
- `planWorkers.ts`: `.catch(() => {})` on `planExpired`/`planGhostAlert` → `log.error`
- `upload.ts`: `.catch(() => {})` on Cloudinary photo delete → `log.error`
- `experienceCredits.ts`: Zod schema `tier` enum corrected (BRONZE → PLATINUM), `type` enum added
- `sponsorCreditWorker`: `retryCount` → `(job as any).attemptsMade` for correct idempotency per retry
- `gift.ts`: added `isValidId()` validation on `/accept`, `/reject`, `/voucher` routes

#### Prisma Schema (Migration Required)
- **Cascade deletes**: `Plan.organizerId`, `PlanApplication.applicantId`, `PlanConfirmation.profileId`, `MessageRequest.matchId`
- **Indexes**: `MeetupCheckin.userId`, `Reward.user1Id`, `Reward.user2Id`, `PlanConfirmation.profileId`, `Plan.matchId`, `Plan.isDeleted`
- **Soft deletes**: `Profile.isDeleted`, `Plan.isDeleted`
- **Timestamps**: `PlanApplication.updatedAt`, `PlanConfirmation.updatedAt`
- **Field fix**: `Profile.bio` varchar(300) → TEXT
- **New fields**: `PlanConfirmation.coinCreditStatus`, `coinCreditAttempts`, `coinCreditFailedAt`, `updatedAt`
- Run: `npx prisma migrate dev --name schema_audit_fixes`

#### Already Correct (No Changes Needed)
- GiftService: Zod validation, atomic updateMany, idempotency
- MessagingService: transactions, FCM with error logging
- ModerationService: proper transactions
- FraudService: atomic Redis operations
- RewardService: null guards, transactions
- NotificationService: Promise.allSettled
- giftExpiryWorker, trustDecayWorker, catalogCacheWorker: correctly re-throw for BullMQ retry
- All routes: auth middleware, Zod validation, rate limiting
- No hardcoded secrets, no auth bypasses, no SQL injection

---

### App (`rendez-app`)

- `MyPlansScreen`: added `isError` state, `retry: 2`, error UI with retry button
- `PlansScreen`: added `isError` state, `retry: 2`, error UI with retry button
- `PlanConfirmScreen`: shows "Coins Earned! 🪙" alert when `coinsCredited === true` on sponsored plans
- `api.ts`: `planAPI.confirm` typed as `PlanConfirmResponse { confirmed, coinsCredited }`

---

### Admin (`rendez-admin`)

- `dashboard/page.tsx`: replaced raw `fetch` with `safeFetch()` (throws on non-2xx)
- `coordinator/page.tsx`: added error catch with UI feedback; cancel button disabled during async
- `users/page.tsx`: raw error messages sanitized (HTML strip + 200-char truncate) on suspend/unsuspend
- `fraud/page.tsx`: raw error messages sanitized (HTML strip + 200-char truncate)

---

### Infrastructure

- `npm run build`: passes (TypeScript clean, zero errors)
- ESLint: passes
- Prisma: generates cleanly (after migration applied)

---

## [1.0.0] — 2026-04-08

All notable changes to Rendez are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-04-08

### Summary
First production release of Rendez — an exclusive REZ-ecosystem dating app.
Real identity (REZ SSO), real intent (gifts), real meetups (QR check-in + rewards).

---

### Backend (`rendez-backend`)

#### Auth & Security
- OTP login via REZ SSO (`POST /auth/otp/send`, `POST /auth/otp/verify`)
- JWT issuance with 30d expiry; isSuspended check on every authenticated request (403)
- Admin Bearer token guard (`ADMIN_API_KEY` env var) on all `/admin/*` routes
- Sentry error tracking stub (init on startup when `SENTRY_DSN` is set)
- HMAC verification on all inbound REZ webhooks

#### Profiles
- Full CRUD with photo upload to Cloudinary (6-slot grid)
- `interestedIn` multi-select preference
- Soft-delete: anonymise all PII fields, preserve relational data (`DELETE /profile/me`)
- `isSuspended` field; admin suspend/unsuspend endpoints

#### Matching & Messaging
- Swipe right → mutual like → ACTIVE match
- Messaging state machine: MATCHED → FREE_MSG_SENT → AWAITING_REPLY → LOCKED → GIFT_PENDING → GIFT_UNLOCKED → OPEN
- Socket.io real-time messaging (shared HTTP+WS port); JWT auth on WS handshake
- Typing indicators, read receipts (`read` field on Message, partial index)
- Enriched match list: last message preview + unread count, sorted unread-first

#### Gifts
- Progressive pricing: 1× → 1.5× → 2× per pair
- 5/day global sender cap (`giftLimiter`)
- 1 gift per sender–receiver pair per 5 min (`giftPairLimiter`) — anti-spam
- Fraud check: max 3 gifts per day to same receiver globally
- REZ wallet hold on send, release on accept, refund on reject

#### Meetups
- REZ venue booking (`POST /meetup/book`)
- QR check-in: both users scan within 30-min window at same bookingId
- Async reward trigger (non-blocking response); REZ coin reward on success
- Fraud gates: 7-day match minimum, 90-day per-pair cooldown
- Nearby venues (`GET /meetup/nearby?lat=&lng=`) via REZ merchant API

#### Admin API
- Dashboard stats, 7/14/30d timeseries (pure SQL, no external deps)
- Meetup list with check-in count, reward status, merchant breakdown
- Gift analytics with status breakdown
- Moderation queue (reports) with resolve/dismiss
- Fraud flags with type filter and resolve action
- User list with suspend/unsuspend

#### Infrastructure
- BullMQ background workers: match expiry, fraud sweeps
- Structured audit log middleware on all outbound REZ partner API calls
- Prisma connection pool: `connection_limit=10`, `pool_timeout=10s`
- OTP rate limit tightened: 3 requests/hour (was 10/15min)
- PostgreSQL schema migrations: `isSuspended`, `Message.matchId`, `Message.read`

#### Testing
- Jest + supertest E2E suite covering full critical path (10 sections, all external deps mocked)
- GitHub Actions CI: real Postgres 16 + Redis 7 services, coverage artifact

---

### App (`rendez-app`)

- First-launch onboarding: 3 slides (purple/amber/green accents), skip button, ToS, SecureStore persistence
- OTP login flow integrated with REZ SSO
- Swipe deck: Reanimated `useSharedValue` + GestureDetector pan gestures, LIKE/PASS overlays
- Real-time chat: Socket.io hook, typing dots, read receipts (✓/✓✓), offline banner, deduplication
- Matches list: photo thumbnails, last message preview, unread badge (9+ cap), green online dot
- Gift picker: full screen, progressive pricing display
- Gift inbox: accept / reject with REZ wallet balance
- Meetup flow: suggest → book → QR scan → waiting → celebration with reward status
- Profile edit: 6-slot Cloudinary photo grid, bio char count, intent chips, interestedIn multi-select
- Settings: notification toggles (persisted via `PATCH /devices/preferences`), account deletion modal
- FCM deep links: `match`/`message`/`gift`/`meetup`/`reward` payload types routing to correct screens
- `rendez://` + `https://rendez.in/` universal deep link support
- EAS build: development/preview/production profiles; `expo-updates` OTA
- App Store metadata: `ITSAppUsesNonExemptEncryption: false`, Associated Domains, Android intent filters

---

### Admin (`rendez-admin`)

- Dashboard: multi-series SVG line chart (zero dependencies), 7/14/30d range, series toggles
- Users: live search, suspend with confirm modal, isSuspended badge
- Gifts: KPI cards, donut acceptance rate (conic-gradient), paginated table
- Meetups: top venues bar chart, filter tabs, check-in / reward status table
- Moderation: report queue, status filter, resolve/dismiss actions
- Fraud: active/resolved toggle, resolve button, type badges
- Deployed to Vercel (Singapore); security headers via `vercel.json`

---

### Infrastructure

- Render deploy config (`render.yaml`): web service + managed Postgres + Redis (Singapore)
- GitHub Actions CI (`ci.yml`): backend E2E, admin TS check, app TS check, deploy gate
- Git tag: `v1.0.0`
