# Rendez — Local Development

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

---

## Quick Start

### 1. Start infrastructure

```bash
# From repo root
docker compose up -d
# Starts: postgres:16 on :5432, redis:7 on :6379
```

### 2. Backend

```bash
cd rendez-backend
cp .env.example .env          # fill in values (see below)
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed            # optional test data
npm run dev                   # nodemon, port 4000
```

**`.env` minimum for local dev:**
```bash
DATABASE_URL=postgresql://rendez:rendez_dev@localhost:5432/rendez
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-not-for-production
JWT_EXPIRES_IN=30d
NODE_ENV=development
PORT=4000

# REZ Partner API (use staging keys)
# RD-CROSS-03 FIX: Must use REZ_PARTNER_API_URL — the env.ts config reads this env var name.
# Using REZ_API_URL (the old name) causes silent failure in local dev.
REZ_PARTNER_API_URL=https://staging-api.rez.money/partner/v1
REZ_PARTNER_API_KEY=sk_test_...
REZ_WEBHOOK_SECRET=whsec_test_...

# Cloudinary (can use free tier)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Firebase (can skip — FCM won't fire, app works fine)
# FIREBASE_SERVICE_ACCOUNT_JSON=

# Admin (any string)
ADMIN_API_KEY=dev-admin-key
```

Backend runs at `http://localhost:4000`
WebSocket at `ws://localhost:4000`

### 3. Admin Dashboard

```bash
cd rendez-admin
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
# Set ADMIN_API_KEY=dev-admin-key
npm install
npm run dev                   # port 3000
```

Admin at `http://localhost:3000`

### 4. Mobile App

```bash
cd rendez-app
npm install
npx expo start                # scan QR with Expo Go on device
```

For local backend: update `src/config/api.ts` or set `EXPO_PUBLIC_API_URL=http://<your-ip>:4000/api/v1` in `.env.local`.

---

## Running Tests

```bash
cd rendez-backend
npm test                      # Jest E2E — uses test DB via env vars

# With coverage
npm test -- --coverage

# Single test file
npm test -- --testPathPattern criticalPath
```

Tests mock all external deps (REZ partner API, FCM, Redis, BullMQ). A real Postgres DB is used in CI; locally tests use `TEST_DATABASE_URL` if set, else fall back to `DATABASE_URL`.

---

## TypeScript Checks

```bash
# Backend
cd rendez-backend && npx tsc --noEmit

# Admin
cd rendez-admin && npx tsc --noEmit

# App
cd rendez-app && npx tsc --noEmit
```

---

## Prisma Cheat Sheet

```bash
# After schema change
npx prisma migrate dev --name your_migration_name

# Regenerate client (after pulling new migrations)
npx prisma generate

# Open DB browser
npx prisma studio

# Reset DB (dev only — destroys data)
npx prisma migrate reset
```

---

## Docker Compose Reference

```yaml
# docker-compose.yml (repo root)
# postgres: localhost:5432  user=rendez pass=rendez_dev db=rendez
# redis:    localhost:6379
# backend:  localhost:4000  (mounts ./rendez-backend, hot-reload)
```

```bash
docker compose up -d          # start
docker compose logs -f        # tail logs
docker compose down           # stop (preserves volumes)
docker compose down -v        # stop + wipe DB
```

---

## Project Structure

```
Rendez/
├── rendez-backend/
│   ├── src/
│   │   ├── config/         # env, database
│   │   ├── middleware/      # auth, adminAuth, rateLimiter, partnerAudit, errorHandler
│   │   ├── routes/          # one file per domain
│   │   ├── services/        # business logic
│   │   ├── realtime/        # Socket.io server
│   │   ├── jobs/            # BullMQ workers
│   │   └── tests/           # Jest E2E
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/
├── rendez-app/
│   └── src/
│       ├── screens/         # one file per screen
│       ├── hooks/           # useRealtimeChat, useDeepLink, useFcmToken
│       ├── store/           # Zustand (authStore)
│       ├── navigation/      # AppNavigator
│       └── config/          # api.ts
├── rendez-admin/
│   └── src/app/
│       ├── dashboard/
│       ├── users/
│       ├── gifts/
│       ├── meetups/
│       ├── moderation/
│       └── fraud/
├── docs/                    # ← you are here
├── CHANGELOG.md
└── docker-compose.yml
```
