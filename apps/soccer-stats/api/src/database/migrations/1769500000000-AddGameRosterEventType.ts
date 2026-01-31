import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the GAME_ROSTER event type for tracking players on a game day roster.
 *
 * This replaces the BENCH event type (which will be migrated in a subsequent migration).
 * GAME_ROSTER events:
 *   - Category: TACTICAL
 *   - requiresPosition: false (position is optional - set for starters, null for bench)
 *   - allowsParent: false (standalone event)
 *
 * A player with a GAME_ROSTER event for a game is on the game day roster.
 * Whether they're a starter or on the bench is determined by the presence of a position:
 *   - position IS NOT NULL → planned starter at that position
 *   - position IS NULL → on the bench
 */
export class AddGameRosterEventType1769500000000 implements MigrationInterface {
  name = 'AddGameRosterEventType1769500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Use INSERT ... WHERE NOT EXISTS for idempotency
    await queryRunner.query(
      `INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
       SELECT uuid_generate_v4(), $1::varchar, $2, $3, $4, $5, NOW(), NOW()
       WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = $1::varchar)`,
      [
        'GAME_ROSTER',
        'TACTICAL',
        'Player added to game day roster',
        false,
        false,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First delete any game_events that reference this event type
    await queryRunner.query(
      `DELETE FROM game_events WHERE "eventTypeId" IN (
         SELECT id FROM event_types WHERE name = 'GAME_ROSTER'
       )`,
    );

    // Then delete the event type itself
    await queryRunner.query(`DELETE FROM event_types WHERE name = 'GAME_ROSTER'`);
  }
}
