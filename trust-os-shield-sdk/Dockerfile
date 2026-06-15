FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3003
CMD ["npm", "start"]