FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 4053

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4053/health || exit 1

CMD ["npm", "start"]