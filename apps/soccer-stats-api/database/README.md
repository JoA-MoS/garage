# Soccer Stats API Database Setup

## Quick Start

### Start the database and API:

```bash
# Start the PostgreSQL database
nx run soccer-stats-api:db:start

# Start the API (will also start the database if not running)
nx run soccer-stats-api:serve:dev
```

### Other useful commands:

```bash
# Stop the database
nx run soccer-stats-api:db:stop

# Reset the database (delete all data)
nx run soccer-stats-api:db:reset

# View database logs
nx run soccer-stats-api:db:logs

# Just start the API (assumes database is already running)
nx run soccer-stats-api:serve
```

## Database Access

- **Database**: PostgreSQL 15
- **Host**: localhost
- **Port**: 5432
- **Database**: soccer_stats
- **Username**: postgres
- **Password**: postgres

## Web Interface

- **API**: http://localhost:3333/api
- **GraphQL Playground**: http://localhost:3333/graphql
- **Database Admin (Adminer)**: http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - Username: postgres
  - Password: postgres
  - Database: soccer_stats

## Environment Variables

Copy `.env.sample` to `.env` in the `apps/soccer-stats-api` directory and modify as needed:

```bash
cp apps/soccer-stats-api/.env.sample apps/soccer-stats-api/.env
```

## Docker Commands (Manual)

If you prefer to run Docker commands manually:

```bash
# Start all services
docker compose up -d

# Start only the database
docker compose up -d postgres

# View logs
docker compose logs -f postgres

# Stop services
docker compose down

# Reset everything (delete volumes)
docker compose down -v
```

## Troubleshooting

### Port 5432 already in use

If you have PostgreSQL running locally, either:

1. Stop your local PostgreSQL: `sudo systemctl stop postgresql`
2. Or change the port in `docker-compose.yml` to something else like `5433:5432`

### Database connection issues

1. Make sure Docker is running
2. Check if the container is running: `docker ps`
3. Check container logs: `nx run soccer-stats-api:db:logs`
