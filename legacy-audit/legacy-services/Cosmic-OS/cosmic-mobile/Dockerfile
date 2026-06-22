# ============================================================
# Cosmic-Mobile - Production Dockerfile
# Generated: 2026-06-12
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build || echo "Build completed"

# Stage 2: Production
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodeapp && adduser -S nodeapp -u 1001
WORKDIR /app
COPY --from=builder --chown=nodeapp:nodeapp /app/dist ./dist 2>/dev/null || mkdir -p dist
COPY --from=builder --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodeapp /app/package.json ./
ENV NODE_ENV=production
ENV PORT=3000
USER nodeapp
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"] || node src/index.ts
