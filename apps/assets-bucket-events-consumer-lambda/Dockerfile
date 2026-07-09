FROM oven/bun:1 AS base

WORKDIR /app

# Stage 1: Prune the monorepo
FROM base AS pruner
RUN bun add -g turbo
COPY . .
# video-processing-container is the name of the app in package.json
RUN turbo prune assets-bucket-events-consumer-lambda --docker

# Stage 2: Install dependencies and build
FROM base AS builder
# Copy json and lockfile to install dependencies first (Docker cache optimization)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy actual source files
COPY --from=pruner /app/out/full/ .

# Build the app using Turbo
RUN bunx turbo run build --filter=assets-bucket-events-consumer-lambda

    
FROM public.ecr.aws/lambda/nodejs:22
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/apps/assets-bucket-events-consumer-lambda/dist/index.js ./index.js
CMD ["index.handler"]