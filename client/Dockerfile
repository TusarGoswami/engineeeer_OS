# Stage 1: Build Vite frontend (monorepo workspace context)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci --workspace=client

COPY client ./client
ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_GITHUB_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_GITHUB_CLIENT_ID=${VITE_GITHUB_CLIENT_ID}
RUN npm run build --workspace=client

# Stage 2: Serve static build + proxy API via Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
