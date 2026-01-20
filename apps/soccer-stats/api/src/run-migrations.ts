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

async function runMigrations(): Promise<void> {
  console.log('=== Database Migration Runner ===');
  console.log(`Host: ${getDbHost()}`);
  console.log(`Database: ${getDbName()}`);
  console.log('');

  try {
    console.log('Initializing database connection...');
    await migrationDataSource.initialize();

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
