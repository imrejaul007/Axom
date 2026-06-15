FROM node:20-alpine
WORKDIR /app
RUN npm install -g expo-cli
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["npx", "expo", "start", "--non-interactive"]