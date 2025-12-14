FROM docker.io/node:24-alpine AS production

ENV NODE_ENV=production

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy entire build output directory
COPY dist/apps/campsite-watcher ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
    pnpm store prune

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app

USER appuser

CMD ["node", "main.js"]
