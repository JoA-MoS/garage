import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GameFormatsService } from '../modules/game-formats/game-formats.service';
import { EventTypesService } from '../modules/event-types/event-types.service';
import { MIGRATIONS_TABLE_NAME } from '../database/typeorm.config';

@Injectable()
export class StartupService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gameFormatsService: GameFormatsService,
    private readonly eventTypesService: EventTypesService,
  ) {}

  async onModuleInit() {
    console.log('🚀 Starting application initialization...');

    try {
      // Register baseline migrations for existing databases
      await this.registerBaselineMigrations();

      // Seed game formats if they don't exist
      await this.gameFormatsService.seedDefaultFormats();

      // Seed event types if they don't exist
      await this.eventTypesService.seedDefaultEventTypes();

      // Ensure new event types added after initial seed exist
      await this.eventTypesService.ensureNewEventTypesExist();

      console.log('✅ Application initialization completed successfully');
    } catch (error) {
      console.error('❌ Error during application initialization:', error);
      // Don't throw to prevent app from crashing on startup
    }
  }

  /**
   * Registers baseline migrations for existing databases that were created
   * before TypeORM migrations were enabled. This is idempotent and safe to
   * run on every startup.
   */
  private async registerBaselineMigrations(): Promise<void> {
    const baselineMigrations = [
      { timestamp: 1768502441068, name: 'InitialSchema1768502441068' },
    ];

    // Create migrations table if it doesn't exist
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        timestamp bigint NOT NULL,
        name varchar NOT NULL
      )
    `);

    for (const migration of baselineMigrations) {
      // Check if migration is already registered
      const existing = await this.dataSource.query(
        `SELECT 1 FROM ${MIGRATIONS_TABLE_NAME} WHERE name = $1`,
        [migration.name],
      );

      if (existing.length === 0) {
        await this.dataSource.query(
          `INSERT INTO ${MIGRATIONS_TABLE_NAME} (timestamp, name) VALUES ($1, $2)`,
          [migration.timestamp, migration.name],
        );
        console.log(`📝 Registered baseline migration: ${migration.name}`);
      }
    }
  }
}
