# Soccer Stats API Dockerfile
# Build: pnpm nx docker:build soccer-stats-api
# Run:   pnpm nx docker:run soccer-stats-api --args="-p 3333:3333"
#
# NOTE: This Dockerfile expects to be built from the workspace root with:
#       docker build -f apps/soccer-stats/api/Dockerfile -t soccer-stats-api .

FROM docker.io/node:22-alpine AS production

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create app directory
WORKDIR /app

# Copy the built application from Nx build output
# The build output includes main.js, package.json, and pnpm-lock.yaml
COPY dist/apps/soccer-stats/api/package.json dist/apps/soccer-stats/api/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm store prune

# Copy the built application code
COPY dist/apps/soccer-stats/api/*.js ./

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose the application port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/api || exit 1

# Start the application
CMD ["node", "main.js"]
