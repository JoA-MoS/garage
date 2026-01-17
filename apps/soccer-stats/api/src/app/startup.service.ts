import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GameFormatsService } from '../modules/game-formats/game-formats.service';
import { EventTypesService } from '../modules/event-types/event-types.service';
import { MIGRATIONS_TABLE_NAME } from '../database/typeorm.config';

@Injectable()
export class StartupService implements OnModuleInit {
  private readonly logger = new Logger(StartupService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly gameFormatsService: GameFormatsService,
    private readonly eventTypesService: EventTypesService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting application initialization...');

    // Migration registration is critical - fail if this doesn't work
    try {
      await this.registerBaselineMigrations();
    } catch (error) {
      this.logger.error(
        'CRITICAL: Failed to register baseline migrations. Application may have schema issues.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // Prevent app from starting with broken migration state
    }

    // Seeding operations - log but continue (idempotent operations)
    try {
      await this.gameFormatsService.seedDefaultFormats();
      await this.eventTypesService.seedDefaultEventTypes();
      await this.eventTypesService.ensureNewEventTypesExist();
    } catch (error) {
      this.logger.warn(
        'Failed to seed reference data. Application will start but some features may not work correctly.',
        error instanceof Error ? error.stack : String(error),
      );
      // Don't throw - seeding is idempotent and will be retried on next startup
    }

    this.logger.log('Application initialization completed successfully');
  }

  /**
   * Registers baseline migrations for existing databases that were created
   * before TypeORM migrations were enabled. This is idempotent and safe to
   * run on every startup.
   *
   * Baseline migrations represent the schema state before migrations were enabled.
   * Only add migrations here if they reflect schema changes that were deployed
   * via synchronize=true before migrations were introduced.
   *
   * @throws {Error} If database connection fails or table creation fails
   */
  private async registerBaselineMigrations(): Promise<void> {
    // DO NOT remove entries - they ensure existing databases register the baseline.
    // New migrations should use migration:generate, not be added here.
    const baselineMigrations = [
      { timestamp: 1768502441068, name: 'InitialSchema1768502441068' },
    ];

    try {
      // Create migrations table if it doesn't exist (matches TypeORM's schema)
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
          id SERIAL PRIMARY KEY,
          timestamp bigint NOT NULL,
          name varchar NOT NULL
        )
      `);
      this.logger.debug(`Migrations table verified: ${MIGRATIONS_TABLE_NAME}`);
    } catch (error) {
      this.logger.error(
        `Failed to create migrations table ${MIGRATIONS_TABLE_NAME}. Check database permissions.`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    for (const migration of baselineMigrations) {
      try {
        const existing = await this.dataSource.query(
          `SELECT 1 FROM ${MIGRATIONS_TABLE_NAME} WHERE name = $1`,
          [migration.name],
        );

        if (existing.length === 0) {
          await this.dataSource.query(
            `INSERT INTO ${MIGRATIONS_TABLE_NAME} (timestamp, name) VALUES ($1, $2)`,
            [migration.timestamp, migration.name],
          );
          this.logger.log(`Registered baseline migration: ${migration.name}`);
        } else {
          this.logger.debug(
            `Baseline migration already registered: ${migration.name}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to register baseline migration ${migration.name}. Database may be in an inconsistent state.`,
          error instanceof Error ? error.stack : String(error),
        );
        throw error;
      }
    }
  }
}
