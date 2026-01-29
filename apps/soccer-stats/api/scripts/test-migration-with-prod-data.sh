#!/bin/bash
# ============================================================
# Test Migration with Production Data
# ============================================================
# This script dumps the AWS RDS database, restores it locally
# into an alternate Docker volume, and runs migrations for testing.
#
# Usage:
#   ./test-migration-with-prod-data.sh dump     # Dump from RDS
#   ./test-migration-with-prod-data.sh restore  # Restore and test
#   ./test-migration-with-prod-data.sh cleanup  # Remove test container/volume
#   ./test-migration-with-prod-data.sh switch   # Switch back to dev container
#
# Environment:
#   Uses same variables as .env.dev (DB_HOST, DB_USERNAME, etc.)
#   Will auto-load from .env.dev if present
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env.dev if it exists (same variables as the app uses)
if [[ -f "$API_DIR/.env.dev" ]]; then
  echo "Loading environment from .env.dev..."
  set -a
  source "$API_DIR/.env.dev"
  set +a
fi

# Configuration - uses same env var names as .env.dev
DB_HOST="${DB_HOST:-your-rds-instance.region.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-soccer_stats}"
DUMP_FILE="soccer_stats_prod.dump"

# Container/volume names
PROD_TEST_CONTAINER="soccer-stats-db-prod-test"
PROD_TEST_VOLUME="soccer_stats_prod_test"
DEV_CONTAINER="soccer-stats-db"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================
# DUMP FROM AWS RDS
# ============================================================
dump_rds() {
  log_info "Dumping database from AWS RDS..."
  log_info "Host: $DB_HOST"
  log_info "Port: $DB_PORT"
  log_info "Database: $DB_NAME"
  log_info "User: $DB_USERNAME"

  if [[ "$DB_HOST" == "your-rds-instance"* ]]; then
    log_error "Please set DB_HOST or ensure .env.dev exists with valid credentials"
    exit 1
  fi

  # Use PGPASSWORD to avoid password prompt
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_NAME" \
    -Fc \
    -f "$DUMP_FILE"

  log_info "Dump complete: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"
}

# ============================================================
# SETUP TEST CONTAINER WITH ALTERNATE VOLUME
# ============================================================
setup_test_container() {
  log_info "Setting up test container with alternate volume..."

  # Create volume if it doesn't exist
  if ! docker volume inspect "$PROD_TEST_VOLUME" &>/dev/null; then
    log_info "Creating volume: $PROD_TEST_VOLUME"
    docker volume create "$PROD_TEST_VOLUME"
  fi

  # Stop dev container if running (to free port 5432)
  if docker ps -q -f name="$DEV_CONTAINER" | grep -q .; then
    log_info "Stopping dev container: $DEV_CONTAINER"
    docker stop "$DEV_CONTAINER"
  fi

  # Remove existing test container if exists
  if docker ps -aq -f name="$PROD_TEST_CONTAINER" | grep -q .; then
    log_info "Removing existing test container"
    docker rm -f "$PROD_TEST_CONTAINER"
  fi

  # Start test container
  log_info "Starting test container: $PROD_TEST_CONTAINER"
  docker run -d \
    --name "$PROD_TEST_CONTAINER" \
    -e POSTGRES_DB=soccer_stats \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_HOST_AUTH_METHOD=trust \
    -p 5432:5432 \
    -v "${PROD_TEST_VOLUME}:/var/lib/postgresql/data" \
    postgres:16-alpine

  # Wait for postgres to be ready
  log_info "Waiting for PostgreSQL to be ready..."
  sleep 3
  until docker exec "$PROD_TEST_CONTAINER" pg_isready -U postgres &>/dev/null; do
    echo -n "."
    sleep 2
  done
  echo ""
  log_info "PostgreSQL is ready"
}

# ============================================================
# RESTORE DUMP TO TEST CONTAINER
# ============================================================
restore_dump() {
  if [[ ! -f "$DUMP_FILE" ]]; then
    log_error "Dump file not found: $DUMP_FILE"
    log_error "Run '$0 dump' first"
    exit 1
  fi

  log_info "Copying dump file to container..."
  docker cp "$DUMP_FILE" "${PROD_TEST_CONTAINER}:/tmp/"

  log_info "Restoring database (this may take a while)..."
  docker exec "$PROD_TEST_CONTAINER" pg_restore \
    -U postgres \
    -d soccer_stats \
    --clean --if-exists \
    "/tmp/$DUMP_FILE" || true  # || true because pg_restore may warn about existing objects

  log_info "Restore complete"
}

# ============================================================
# RUN MIGRATION
# ============================================================
run_migration() {
  log_info "Running migration..."

  # Navigate to workspace root
  cd "$(dirname "$0")/../../.."

  pnpm nx migration:run soccer-stats-api
}

# ============================================================
# VALIDATE MIGRATION
# ============================================================
validate_migration() {
  log_info "Validating migration..."

  echo ""
  echo "=== Event Counts ==="
  PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "
SELECT
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE \"periodSecond\" IS NULL) as null_periodSecond,
  COUNT(*) FILTER (WHERE \"period\" IS NULL) as null_period
FROM game_events;
"

  echo ""
  echo "=== Data Transformation Check ==="
  PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "
SELECT
  'First half mismatches' as check_type,
  COUNT(*) as count
FROM game_events
WHERE \"gameMinute\" < 45
  AND \"periodSecond\" != (\"gameMinute\" * 60 + \"gameSecond\")
UNION ALL
SELECT
  'Second half mismatches',
  COUNT(*)
FROM game_events
WHERE \"gameMinute\" >= 45
  AND \"periodSecond\" != ((\"gameMinute\" - 45) * 60 + \"gameSecond\");
"

  echo ""
  echo "=== Period Distribution ==="
  PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "
SELECT \"period\", COUNT(*) as count
FROM game_events
GROUP BY \"period\"
ORDER BY \"period\";
"

  echo ""
  echo "=== Sample Data ==="
  PGPASSWORD=postgres psql -h localhost -U postgres -d soccer_stats -c "
SELECT \"gameMinute\", \"gameSecond\", \"period\", \"periodSecond\"
FROM game_events
WHERE \"gameMinute\" > 0
ORDER BY \"gameMinute\", \"gameSecond\"
LIMIT 10;
"
}

# ============================================================
# CLEANUP
# ============================================================
cleanup() {
  log_info "Cleaning up test environment..."

  if docker ps -q -f name="$PROD_TEST_CONTAINER" | grep -q .; then
    log_info "Stopping test container"
    docker stop "$PROD_TEST_CONTAINER"
  fi

  if docker ps -aq -f name="$PROD_TEST_CONTAINER" | grep -q .; then
    log_info "Removing test container"
    docker rm "$PROD_TEST_CONTAINER"
  fi

  read -p "Remove test volume $PROD_TEST_VOLUME? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker volume rm "$PROD_TEST_VOLUME"
    log_info "Volume removed"
  fi

  log_info "Cleanup complete"
}

# ============================================================
# SWITCH BACK TO DEV CONTAINER
# ============================================================
switch_to_dev() {
  log_info "Switching back to dev container..."

  # Stop test container if running
  if docker ps -q -f name="$PROD_TEST_CONTAINER" | grep -q .; then
    docker stop "$PROD_TEST_CONTAINER"
  fi

  # Start dev container
  if docker ps -aq -f name="$DEV_CONTAINER" | grep -q .; then
    docker start "$DEV_CONTAINER"
    log_info "Dev container started: $DEV_CONTAINER"
  else
    log_warn "Dev container not found. Run 'pnpm nx db:start soccer-stats-api'"
  fi
}

# ============================================================
# MAIN
# ============================================================
case "${1:-}" in
  dump)
    dump_rds
    ;;
  restore)
    setup_test_container
    restore_dump
    run_migration
    validate_migration
    ;;
  validate)
    validate_migration
    ;;
  migrate)
    run_migration
    validate_migration
    ;;
  cleanup)
    cleanup
    ;;
  switch)
    switch_to_dev
    ;;
  *)
    echo "Usage: $0 {dump|restore|validate|migrate|cleanup|switch}"
    echo ""
    echo "Commands:"
    echo "  dump      - Dump database from AWS RDS"
    echo "  restore   - Setup test container, restore dump, run migration, validate"
    echo "  validate  - Run validation queries only"
    echo "  migrate   - Run migration and validate (skip restore)"
    echo "  cleanup   - Remove test container and volume"
    echo "  switch    - Switch back to dev container"
    echo ""
    echo "Environment:"
    echo "  Auto-loads from .env.dev if present, or set these variables:"
    echo "  DB_HOST      - AWS RDS hostname (required for dump)"
    echo "  DB_PORT      - Database port (default: 5432)"
    echo "  DB_USERNAME  - Database user (default: postgres)"
    echo "  DB_PASSWORD  - Database password"
    echo "  DB_NAME      - Database name (default: soccer_stats)"
    exit 1
    ;;
esac
