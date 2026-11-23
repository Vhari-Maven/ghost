# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including dev for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Prune dev dependencies for production
RUN rm -rf node_modules && bun install --production --frozen-lockfile

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Install timezone support (and CA roots for tailscaled)
RUN apt-get update && apt-get install -y \
    tzdata ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tailscale, so the server can reach the camera gateway on kitten (see deploy/fly-start.sh)
COPY --from=docker.io/tailscale/tailscale:v1.104.7 /usr/local/bin/tailscaled /usr/local/bin/tailscale /usr/local/bin/

# Copy built app and production dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy migration files (needed for db:migrate on deploy)
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./

# Create data directory (will be mounted as volume)
RUN mkdir -p /data

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/ghost.db

EXPOSE 3000

# Join the tailnet (if configured), then run the app
COPY --from=builder /app/deploy/fly-start.sh ./fly-start.sh
CMD ["/bin/sh", "./fly-start.sh"]
