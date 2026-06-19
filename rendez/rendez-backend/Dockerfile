# ===========================================
# Rendez Backend — Multi-stage Dockerfile
# ===========================================
# Production: docker build -t rendez-backend . && docker run -p 4000:4000 rendez-backend
# Dev:        docker compose up rendez-backend
# ===========================================

# ── Builder Stage ──────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ── Production Stage ───────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache tini curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

RUN chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
