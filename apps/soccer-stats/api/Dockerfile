# Soccer Stats API Dockerfile
# Build: pnpm nx docker:build soccer-stats-api
# Run:   pnpm nx docker:run soccer-stats-api --args="-p 3333:3333"
#
# NOTE: This Dockerfile expects to be built from the workspace root with:
#       docker build -f apps/soccer-stats/api/Dockerfile -t soccer-stats-api .

FROM docker.io/node:22-alpine AS production

ARG APP_VERSION=0.0.1
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV APP_VERSION=${APP_VERSION}
ENV GIT_SHA=${GIT_SHA}
ENV BUILD_TIME=${BUILD_TIME}
# Cap the V8 heap below the 512 MB App Runner instance memory so GC kicks in
# before the container is OOM-killed. Node does not reliably derive this from
# container limits on its own. Verify in prod via /api/health heapSizeLimitMB.
ENV NODE_OPTIONS=--max-old-space-size=400

# Enable corepack for pnpm, pinned to the workspace's configured pnpm
# version for reproducible builds instead of floating on pnpm@latest.
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Create app directory
WORKDIR /app

# RDS/Aurora CA bundle so Node can verify the database TLS certificate
# (DATABASE_URL uses sslmode=require; without this the TLS handshake fails
# with UNABLE_TO_GET_ISSUER_CERT_LOCALLY)
ADD --chmod=0644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem

# Copy entire build output directory
COPY dist/apps/soccer-stats/api ./

# Install production dependencies only.
# No --frozen-lockfile: Nx's generatePackageJson prunes a per-app
# pnpm-lock.yaml from the workspace lockfile, and that pruning can omit
# snapshot entries for transitive peer-qualified packages (e.g.
# @apollo/cache-control-types) even though every version is still pinned
# in the generated package.json. pnpm resolves the gap itself when not
# frozen; the real lockfile contract is still enforced by the workspace
# install in CI.
RUN pnpm install --prod --ignore-scripts && \
    pnpm store prune

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose the application port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333/api/health || exit 1

# Start the application
CMD ["node", "main.js"]
