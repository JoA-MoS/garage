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

# RDS/Aurora CA bundle so Node can verify the database TLS certificate
# (DATABASE_URL uses sslmode=require; without this the TLS handshake fails
# with UNABLE_TO_GET_ISSUER_CERT_LOCALLY)
ADD --chmod=0644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem

# Copy entire build output directory
COPY dist/apps/soccer-stats/api ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts && \
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
