/**
 * Production migration runner script.
 *
 * This script is built as a separate entry point and runs migrations
 * in the ECS migration container before the app container starts.
 *
 * Usage: node run-migrations.js
 *
 * Exit codes:
 *   0 - Migrations completed successfully (or no pending migrations)
 *   1 - Migration failed
 */

import { DataSource } from 'typeorm';

import {
  getDbHost,
  getDbPort,
  getDbUsername,
  getDbPassword,
  getDbName,
  isProduction,
} from './app/environment';
import { MIGRATIONS_TABLE_NAME } from './database/typeorm.config';
import { migrations } from './database/migrations';

/**
 * Production DataSource configuration for migrations.
 * Uses explicit migration imports for webpack compatibility.
 */
const migrationDataSource = new DataSource({
  type: 'postgres',
  host: getDbHost(),
  port: getDbPort(),
  username: getDbUsername(),
  password: getDbPassword(),
  database: getDbName(),
  ssl: isProduction() ? { rejectUnauthorized: false } : false,
  migrationsTableName: MIGRATIONS_TABLE_NAME,
  migrations,
  // Entities not needed for running migrations
  entities: [],
  // Never synchronize - migrations handle schema
  synchronize: false,
  // Log migration queries for visibility
  logging: ['migration', 'error'],
});

/**
 * Register baseline migration for databases created before migrations were enabled.
 *
 * If the database has existing schema (e.g., from synchronize: true) but no
 * migration records, this registers InitialSchema as already applied.
 */
async function registerBaselineIfNeeded(dataSource: DataSource): Promise<void> {
  const BASELINE_MIGRATION = 'InitialSchema1768502441068';
  const BASELINE_TIMESTAMP = 1768502441068;

  // Check if migrations table exists and has the baseline
  const hasBaseline = await dataSource
    .query(`SELECT 1 FROM ${MIGRATIONS_TABLE_NAME} WHERE name = $1 LIMIT 1`, [
      BASELINE_MIGRATION,
    ])
    .then((rows) => rows.length > 0)
    .catch(() => false); // Table doesn't exist yet

  if (hasBaseline) {
    return; // Baseline already registered
  }

  // Check if schema exists (look for a table from InitialSchema)
  const schemaExists = await dataSource
    .query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1`,
    )
    .then((rows) => rows.length > 0)
    .catch(() => false);

  if (!schemaExists) {
    return; // Fresh database, let migrations create everything
  }

  // Schema exists but baseline not registered - register it
  console.log('Existing schema detected without migration records.');
  console.log(`Registering baseline migration: ${BASELINE_MIGRATION}`);

  await dataSource.query(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
      id SERIAL PRIMARY KEY,
      timestamp bigint NOT NULL,
      name varchar NOT NULL
    )`,
  );

  await dataSource.query(
    `INSERT INTO ${MIGRATIONS_TABLE_NAME} (timestamp, name) VALUES ($1, $2)`,
    [BASELINE_TIMESTAMP, BASELINE_MIGRATION],
  );

  console.log('Baseline migration registered successfully.');
}

async function runMigrations(): Promise<void> {
  console.log('=== Database Migration Runner ===');
  console.log(`Host: ${getDbHost()}`);
  console.log(`Database: ${getDbName()}`);
  console.log('');

  try {
    console.log('Initializing database connection...');
    await migrationDataSource.initialize();

    // Handle databases created before migrations were enabled
    await registerBaselineIfNeeded(migrationDataSource);

    console.log('Checking for pending migrations...');
    const pendingMigrations = await migrationDataSource.showMigrations();

    if (!pendingMigrations) {
      console.log('Database is up to date - no pending migrations.');
      await migrationDataSource.destroy();
      process.exit(0);
    }

    console.log('Running pending migrations...');
    const executedMigrations = await migrationDataSource.runMigrations({
      transaction: 'each',
    });

    if (executedMigrations.length === 0) {
      console.log('No migrations were executed.');
    } else {
      console.log(
        `Successfully executed ${executedMigrations.length} migration(s):`,
      );
      executedMigrations.forEach((migration) => {
        console.log(`  ✓ ${migration.name}`);
      });
    }

    await migrationDataSource.destroy();
    console.log('');
    console.log('=== Migrations Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('=== Migration Failed ===');
    console.error(error instanceof Error ? error.message : String(error));

    try {
      await migrationDataSource.destroy();
    } catch {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
}

// Run migrations
runMigrations();
