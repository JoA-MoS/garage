-- Initialize the soccer_stats database
-- This script runs when the PostgreSQL container starts for the first time
-- Ensure the database exists (it should already be created via POSTGRES_DB env var)
SELECT 'CREATE DATABASE soccer_stats'
WHERE NOT EXISTS (
        SELECT
        FROM pg_database
        WHERE datname = 'soccer_stats'
    );
-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Set timezone
SET timezone = 'UTC';