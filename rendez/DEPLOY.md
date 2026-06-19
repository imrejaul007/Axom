# Rendez Deployment Guide

## Required GitHub Secrets

Before deploying, you need to add these secrets to your GitHub repository:

### 1. RENDER_API_TOKEN (Required)
1. Go to https://dashboard.render.com/api-keys
2. Click "Create API Key"
3. Name it something like "GitHub Actions"
4. Copy the key
5. Go to https://github.com/imrejaul007/Rendez/settings/secrets/actions
6. Click "New repository secret"
7. Name: `RENDER_API_TOKEN`
8. Value: Paste the key from Render

### 2. REZ_PARTNER_API_KEY (Required for backend)
1. Get the API key from the REZ API Gateway admin
2. Go to https://github.com/imrejaul007/Rendez/settings/secrets/actions
3. Click "New repository secret"
4. Name: `REZ_PARTNER_API_KEY`
5. Value: Your REZ Partner API key

## What Gets Deployed

The `render.yaml` blueprint deploys:

1. **rendez-db** - PostgreSQL database (starter plan, $7/mo)
2. **rendez-backend** - Node.js API server
   - Auto-deploys on main push
   - Requires: REDIS_URL, REZ_PARTNER_API_KEY, Cloudinary, Firebase credentials
3. **rendez-admin** - Next.js admin dashboard
   - Built automatically
   - Points to rendez-backend API

## Manual Environment Variables

These must be set manually in the Render dashboard after first deploy:

### rendez-backend
- `REDIS_URL` - Redis connection string (create a Redis instance on Render)
- `REZ_PARTNER_API_KEY` - Set via GitHub Actions (see above)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase service account JSON

## Deployment Status

Check deployment at: https://dashboard.render.com/blueprints

## Troubleshooting

### Blueprint fails to create services
- Ensure RENDER_API_TOKEN has correct permissions
- Check if services already exist with same names

### Backend fails to start
- Check logs at: https://dashboard.render.com
- Verify DATABASE_URL is set (from rendez-db)
- Verify REDIS_URL is set (from Redis instance)

### Database migration fails
- Check that DATABASE_URL is correct
- Ensure rendez-db is running
