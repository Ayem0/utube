FROM oven/bun:1.4.2-alpine AS base

WORKDIR /app

# Stage 1: Prune the monorepo
FROM base AS pruner
RUN bun add -g turbo
COPY . .

RUN turbo telemetry disable

# video-processing-container is the name of the app in package.json
RUN turbo prune @repo/image-processing-worker --docker

# Stage 2: Install dependencies and build
FROM base AS builder
# Copy json and lockfile to install dependencies first (Docker cache optimization)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy actual source files
COPY --from=pruner /app/out/full/ .

# Build the app using Turbo (which runs the vite build script)
RUN bunx turbo run build --filter=@repo/image-processing-worker

# Stage 3: Runner
FROM base AS runner

# Copy built application from builder stage
COPY --from=builder /app .

# Set the working directory to the worker's application folder
WORKDIR /app/apps/image-processing-worker

# Expose 8080 port (match container_src/index.ts ImageProcessingContainer default port)
EXPOSE 8080
# Run the index.ts file using the bun runtime
CMD ["bun", "run", "dist/index.mjs"]
