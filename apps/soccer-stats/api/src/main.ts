/**
 * Soccer Stats API - NestJS GraphQL Backend
 * This server provides a GraphQL API for the soccer statistics tracker application.
 */

import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from './app/app.module';
import {
  API_PREFIX,
  getPort,
  isProduction,
  getFrontendUrl,
  useJsonLogging,
} from './app/environment';

// App-specific advisory lock key for serializing startup migrations
const MIGRATION_LOCK_ID = 784_512_301;

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger({
        json: useJsonLogging(),
      }),
    });

    // Global configuration - uses API_PREFIX from environment.ts for consistency with GraphQL path
    app.setGlobalPrefix(API_PREFIX);

    // Note: ValidationPipe is not used for this GraphQL API.
    // GraphQL provides its own schema-based validation.
    // The NestJS ValidationPipe with forbidNonWhitelisted causes
    // conflicts with GraphQL input types.

    // CORS configuration
    // - Same-origin requests are always allowed (origin header is undefined)
    // - Cross-origin requests are allowed only if origin is in FRONTEND_URL
    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Same-origin requests don't send Origin header - always allow
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in the allowed list from FRONTEND_URL
        const frontendUrl = getFrontendUrl();
        if (frontendUrl) {
          const allowedOrigins = frontendUrl
            .split(',')
            .map((url) => url.trim());
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
        }

        // Reject cross-origin requests not in allowed list
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      credentials: true,
    });

    // Run pending TypeORM migrations before accepting traffic.
    // App Runner health check won't pass until this completes, so no traffic
    // is routed until the database schema is up to date.
    //
    // A Postgres advisory lock serializes concurrent instances (App Runner
    // can start several during deploys/scale-out): the first runs migrations
    // while the rest block on the lock, then find nothing pending. Advisory
    // locks are session-scoped, so acquire and release must happen on the
    // same connection — hence the dedicated query runner instead of the pool.
    const dataSource = app.get(DataSource);
    const lockRunner = dataSource.createQueryRunner();
    await lockRunner.connect();
    await lockRunner.query(`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`);
    try {
      // Fresh RDS/Aurora databases don't have the extensions our migrations
      // rely on (locally these are created by database/init scripts).
      await lockRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await lockRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      const pendingMigrations = await dataSource.showMigrations();
      if (pendingMigrations) {
        logger.log('Running pending database migrations...');
        await dataSource.runMigrations();
        logger.log('Migrations complete.');
      }
    } finally {
      await lockRunner.query(`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`);
      await lockRunner.release();
    }

    const port = getPort();
    await app.listen(port);

    logger.log(`Soccer Stats API running on port ${port}`);
    logger.log(`GraphQL endpoint: /${API_PREFIX}/graphql`);

    if (!isProduction()) {
      logger.log(`Local URL: http://localhost:${port}/${API_PREFIX}`);
      logger.log(
        `GraphQL Playground: http://localhost:${port}/${API_PREFIX}/graphql`,
      );
    }
  } catch (error) {
    logger.error(
      'Failed to bootstrap application',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  // Fallback handler for any unhandled rejections during bootstrap
  console.error('Unhandled error during bootstrap:', error);
  process.exit(1);
});
