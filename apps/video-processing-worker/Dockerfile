FROM oven/bun:1 AS base

# Install ffmpeg and ca-certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Stage 1: Prune the monorepo
FROM base AS pruner
RUN bun add -g turbo
COPY . .
# video-processing-container is the name of the app in package.json
RUN turbo prune video-processing-worker --docker

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
RUN bunx turbo run build --filter=video-processing-worker...

# Stage 3: Runner
FROM base AS runner

# Copy built application from builder stage
COPY --from=builder /app .

# Set the working directory to the worker's application folder
WORKDIR /app/apps/video-processing-worker

# Run the worker.ts file using the bun runtime
CMD ["bun", "run", "src/worker.ts"]
