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

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Install timezone support
RUN apt-get update && apt-get install -y \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Copy built app and production dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy migration files (needed for db:migrate on deploy)
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/scripts ./scripts

# Create data directory (will be mounted as volume)
RUN mkdir -p /data

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/ghost.db

EXPOSE 3000

# Run the app
CMD ["bun", "./build"]
