# Multi-stage Dockerfile for GatherWise (Node 22 slim, non-root user)

# --- Stage 1: Build ---
FROM node:22-slim AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy dependency manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built server and client assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Use non-root node user for security
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/server/index.js"]
