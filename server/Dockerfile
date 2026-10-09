# Build and production image for Node.js 20 backend
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# Default command runs API server, overridden by worker service
EXPOSE 5000
CMD ["node", "src/server.js"]
