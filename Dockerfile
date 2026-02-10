# Multi-stage Dockerfile for Next.js application using Bun (canary)

# Stage 1: Build the application
FROM oven/bun:canary-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock* ./

# Install dependencies using bun
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Stage 2: Run the application
FROM oven/bun:canary-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json /app/bun.lock* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Environment variables (can be overridden)
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "start"]