# Docker Setup Instructions

## Prerequisites

1. **Docker Desktop must be running**

   - Make sure Docker Desktop is started
   - Check if it's running: `docker ps`

2. **WSL Integration (if using WSL)**
   - In Docker Desktop settings, go to Resources → WSL Integration
   - Enable integration with your WSL distro

## Alternative: Manual Docker Commands

If the Nx tasks don't work, you can run Docker commands directly:

```bash
# Start the database
docker compose up -d postgres

# Check if it's running
docker ps

# View logs
docker compose logs postgres

# Stop the database
docker compose stop postgres
```

## Alternative: Use a different database

If Docker continues to have issues, you can:

1. Install PostgreSQL locally
2. Update the database connection in `apps/soccer-stats-api/src/app/app.module.ts`
3. Use SQLite for development by changing the TypeORM configuration

## Troubleshooting Docker Permission Issues

If you get permission denied errors:

1. Make sure Docker Desktop is running
2. Try: `sudo usermod -aG docker $USER` then log out and back in
3. Or use: `sudo docker compose up -d postgres` (not recommended for long-term use)
