FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build 2>/dev/null || true

# Expose port
EXPOSE 4180

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4180/health || exit 1

# Run
CMD ["node", "dist/index.js"]
