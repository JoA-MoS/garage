import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds database indexes for frequently queried columns in game_events table.
 *
 * These indexes improve performance for:
 * - Queries filtering by gameTeamId (most common, used in nearly every game event query)
 * - Queries filtering by eventTypeId (event type filtering)
 * - Queries filtering by gameId (game-scoped queries)
 * - Composite queries filtering by both gameTeamId and eventTypeId
 *
 * See GitHub issue #210 for context.
 */
export class AddGameEventIndexes1769900000000 implements MigrationInterface {
  name = 'AddGameEventIndexes1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for gameTeamId - most frequently used
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_game_events_gameTeamId" ON "game_events" ("gameTeamId")
    `);

    // Index for eventTypeId - used for event type filtering
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_game_events_eventTypeId" ON "game_events" ("eventTypeId")
    `);

    // Index for gameId - used for game-scoped queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_game_events_gameId" ON "game_events" ("gameId")
    `);

    // Composite index for queries filtering by both gameTeamId and eventTypeId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_game_events_gameTeamId_eventTypeId" ON "game_events" ("gameTeamId", "eventTypeId")
    `);

    // Index for gameId on game_teams table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_game_teams_gameId" ON "game_teams" ("gameId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_teams_gameId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_game_events_gameTeamId_eventTypeId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_game_events_gameId"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_game_events_eventTypeId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_game_events_gameTeamId"`,
    );
  }
}
