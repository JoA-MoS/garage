/**
 * TypeORM Data Source for CLI migrations.
 *
 * This file is used by the TypeORM CLI (typeorm-ts-node-commonjs) for:
 * - migration:generate - Generate new migrations from entity changes
 * - migration:run - Run pending migrations
 * - migration:show - Show migration status
 *
 * Environment variables are loaded by Nx before commands run.
 * See project.json for the migration:* targets.
 */

import * as path from 'path';

import { DataSource, DataSourceOptions } from 'typeorm';

import { baseTypeOrmConfig } from './typeorm.config';

const PROJECT_ROOT = 'apps/soccer-stats/api/src';

/**
 * CLI-specific configuration with explicit entity and migration paths.
 * The CLI cannot use autoLoadEntities - it needs glob patterns.
 * Note: Migration pattern uses [0-9]* prefix to exclude index.ts (used for webpack bundling).
 */
export const cliDataSourceOptions: DataSourceOptions = {
  ...baseTypeOrmConfig,
  entities: [path.join(PROJECT_ROOT, 'entities', '*.entity.{ts,js}')],
  migrations: [
    path.join(PROJECT_ROOT, 'database', 'migrations', '[0-9]*-*.{ts,js}'),
  ],
};

/**
 * DataSource instance for TypeORM CLI.
 * Default export required by typeorm-ts-node-commonjs CLI.
 * Note: Only default export allowed - CLI rejects files with multiple DataSource exports.
 */
export default new DataSource(cliDataSourceOptions);
