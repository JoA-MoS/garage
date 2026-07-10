/**
 * Shared TypeORM configuration used by both NestJS app and CLI migrations.
 *
 * Environment variables are loaded by Nx before commands run (see project.json).
 * No manual dotenv loading is needed.
 */

import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import {
  getDatabaseUrl,
  getDbHost,
  getDbPort,
  getDbUsername,
  getDbPassword,
  getDbName,
  getDbSynchronize,
  getDbLogging,
  getDbSsl,
  getValidatedPoolConfig,
  getDbPoolIdleTimeout,
  getDbPoolConnectionTimeout,
} from '../app/environment';

import { migrations } from './migrations';

/**
 * Migrations table name - must be consistent between CLI and runtime.
 */
export const MIGRATIONS_TABLE_NAME = 'typeorm_migrations';

// Get validated pool config (warns and clamps if min > max)
const poolConfig = getValidatedPoolConfig();

const databaseUrl = getDatabaseUrl();

/** Base TypeORM configuration. Uses DATABASE_URL (App Runner) or individual vars (local dev). */
export const baseTypeOrmConfig = {
  type: 'postgres' as const,
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: getDbHost(),
        port: getDbPort(),
        username: getDbUsername(),
        password: getDbPassword(),
        database: getDbName(),
      }),
  synchronize: getDbSynchronize(),
  logging: getDbLogging(),
  ssl: getDbSsl() ? { rejectUnauthorized: false } : false,
  migrationsTableName: MIGRATIONS_TABLE_NAME,
  // Connection pool configuration for PostgreSQL
  extra: {
    max: poolConfig.max,
    min: poolConfig.min,
    idleTimeoutMillis: getDbPoolIdleTimeout(),
    connectionTimeoutMillis: getDbPoolConnectionTimeout(),
  },
};

/**
 * TypeORM configuration for NestJS runtime.
 * Includes migrations array so dataSource.runMigrations() works in main.ts.
 */
export const nestTypeOrmConfig: TypeOrmModuleOptions = {
  ...baseTypeOrmConfig,
  autoLoadEntities: true,
  migrations,
};
