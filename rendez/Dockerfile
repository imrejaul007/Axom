FROM node:20-alpine

WORKDIR /app

# Copy all rendez components
COPY rendez-backend/package*.json ./rendez-backend/
COPY rendez-app/package*.json ./rendez-app/
COPY rendez-admin/package*.json ./rendez-admin/

WORKDIR /app/rendez-backend
RUN npm ci --only=production

WORKDIR /app

EXPOSE 4060 3001 4061

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4060/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["echo", "Use rendez-backend, rendez-app, or rendez-admin Dockerfiles separately"]
