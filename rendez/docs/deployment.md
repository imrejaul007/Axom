# Rendez — Deployment Guide

## Services

| Service | Platform | Region | URL |
|---------|----------|--------|-----|
| Backend | Render (Web Service) | Singapore | `https://rendez-backend.onrender.com` |
| Admin | Vercel | Singapore | `https://rendez-admin.vercel.app` |
| iOS / Android | Expo EAS | — | App Store / Play Store |

---

## Backend — Render

### First Deploy

1. Connect `imrejaul007/Rendez` repo to Render
2. Set root directory to `rendez-backend`
3. Build command: `npm ci && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && node dist/index.js`
5. Add environment variables (see below)
6. Create a managed Postgres 16 instance → copy DATABASE_URL
7. Create a managed Redis 7 instance → copy REDIS_URL

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...            # Render managed Postgres

# Redis
REDIS_URL=redis://...                    # Render managed Redis

# Auth
JWT_SECRET=<min 64 chars random string>
JWT_EXPIRES_IN=30d

# REZ Partner API
REZ_API_URL=https://api.rez.money/partner/v1
REZ_API_KEY=<from REZ partner dashboard>
REZ_WEBHOOK_SECRET=<from REZ partner dashboard>

# Cloudinary (photo upload)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Firebase (FCM push notifications)
FIREBASE_SERVICE_ACCOUNT_JSON=<escaped JSON string>

# Admin
ADMIN_API_KEY=<random 64-char string — guards all /admin/* routes>

# Sentry (optional but recommended in production)
SENTRY_DSN=https://...@sentry.io/...

# App
NODE_ENV=production
PORT=4000
```

### Render `render.yaml` (already in repo)
The repo includes `rendez-backend/render.yaml` with the full service config. Render auto-deploys on push to `main`.

---

## Admin — Vercel

### First Deploy

```bash
cd rendez-admin
npx vercel --prod
```

Or connect the repo in Vercel dashboard, set root directory to `rendez-admin`.

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://rendez-backend.onrender.com/api/v1
ADMIN_API_KEY=<same value as backend ADMIN_API_KEY>
```

The `vercel.json` in `rendez-admin/` sets Singapore region and security headers (CSP, HSTS, X-Frame-Options).

---

## App — EAS Build

### Setup (one-time)

```bash
npm install -g eas-cli
eas login
cd rendez-app
eas build:configure
```

Update `app.config.js`:
- Set `extra.apiUrl` to `https://rendez-backend.onrender.com/api/v1`
- Update `owner` to your Expo account name
- Update `ios.bundleIdentifier` and `android.package`

### Build Profiles

```bash
# Development (internal distribution, localhost API)
eas build --platform all --profile development

# Preview (APK, production API)
eas build --platform android --profile preview

# Production (App Store + Play Store)
eas build --platform all --profile production
```

### Submit

```bash
eas submit --platform ios      # requires Apple credentials
eas submit --platform android  # requires Google Play service account
```

### OTA Updates

```bash
eas update --branch production --message "v1.0.1 hotfix"
```

---

## Database Migrations

For schema changes, create a new migration:

```bash
cd rendez-backend
npx prisma migrate dev --name describe_change
```

On deploy, Render runs `npx prisma migrate deploy` before starting the server (see start command above).

---

## First-Time Data Seed

```bash
cd rendez-backend
npx ts-node prisma/seed.ts
```

---

## Health Check

```bash
curl https://rendez-backend.onrender.com/health
# { "status": "ok", "service": "rendez-backend" }
```

---

## Rollback

Render keeps the last 5 deploys. In the Render dashboard:
- **Services → rendez-backend → Deploys → [previous deploy] → Rollback**

Vercel:
- **Deployments → [previous deployment] → Promote to Production**
