-- Register baseline migration for existing databases
--
-- Run this script ONCE on databases that existed before TypeORM migrations were enabled.
-- This marks the InitialSchema migration as already applied, preventing TypeORM from
-- attempting to recreate tables that already exist.
--
-- Usage:
--   psql -h localhost -U postgres -d soccer_stats -f register-baseline.sql
--
-- This is idempotent - safe to run multiple times.

-- Create migrations table if it doesn't exist (matches TypeORM's schema)
CREATE TABLE IF NOT EXISTS typeorm_migrations (
  id SERIAL PRIMARY KEY,
  timestamp bigint NOT NULL,
  name varchar NOT NULL
);

-- Register baseline migration (skip if already registered)
INSERT INTO typeorm_migrations (timestamp, name)
SELECT 1768502441068, 'InitialSchema1768502441068'
WHERE NOT EXISTS (
  SELECT 1 FROM typeorm_migrations WHERE name = 'InitialSchema1768502441068'
);
