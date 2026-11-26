# Build and production image for Node.js 20 backend (monorepo workspace context)
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace=server --omit=dev

COPY server ./server
WORKDIR /app/server

# Default command runs API server, overridden by worker service
EXPOSE 5000
CMD ["node", "src/server.js"]
