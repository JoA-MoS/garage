/**
 * Shared TypeORM configuration used by both NestJS app and CLI migrations.
 *
 * Environment variables are loaded by Nx before commands run (see project.json).
 * No manual dotenv loading is needed.
 */

import { DataSourceOptions } from 'typeorm';

import {
  getDbHost,
  getDbPort,
  getDbUsername,
  getDbPassword,
  getDbName,
  getDbSynchronize,
  getDbLogging,
  getDbSsl,
} from '../app/environment';

/**
 * Migrations table name - must be consistent between CLI and runtime.
 */
export const MIGRATIONS_TABLE_NAME = 'typeorm_migrations';

/**
 * Base TypeORM configuration shared between NestJS app and CLI.
 * Does not include entities/migrations paths - those differ by context.
 */
export const baseTypeOrmConfig = {
  type: 'postgres' as const,
  host: getDbHost(),
  port: getDbPort(),
  username: getDbUsername(),
  password: getDbPassword(),
  database: getDbName(),
  synchronize: getDbSynchronize(),
  logging: getDbLogging(),
  ssl: getDbSsl() ? { rejectUnauthorized: false } : false,
  migrationsTableName: MIGRATIONS_TABLE_NAME,
};

/**
 * TypeORM configuration for NestJS runtime.
 * Uses autoLoadEntities for automatic entity discovery from modules.
 *
 * Note: Migrations are NOT loaded here - they run via a separate ECS container
 * before the app starts. See apps/soccer-stats/api-infra for deployment config.
 */
export const nestTypeOrmConfig: DataSourceOptions = {
  ...baseTypeOrmConfig,
  // NestJS discovers entities via TypeOrmModule.forFeature() in each module
  autoLoadEntities: true,
} as DataSourceOptions;
