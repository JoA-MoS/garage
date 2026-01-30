import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the BENCH and STARTING_LINEUP event types that are no longer needed.
 *
 * Context:
 * - BENCH events have been converted to GAME_ROSTER in a previous migration
 * - STARTING_LINEUP was never used (0 events exist with this type)
 *
 * The GAME_ROSTER event type now handles both cases:
 * - position IS NOT NULL → planned starter at that position
 * - position IS NULL → on the bench
 */
export class RemoveUnusedEventTypes1769700000000 implements MigrationInterface {
  name = 'RemoveUnusedEventTypes1769700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete BENCH and STARTING_LINEUP event types
    // BENCH has been converted to GAME_ROSTER
    // STARTING_LINEUP was never used (0 events)
    await queryRunner.query(`
      DELETE FROM event_types WHERE name IN ('BENCH', 'STARTING_LINEUP')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the event types
    await queryRunner.query(`
      INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'BENCH', 'TACTICAL', 'Player assigned to bench roster for the game', false, false, NOW(), NOW()),
        (uuid_generate_v4(), 'STARTING_LINEUP', 'TACTICAL', 'Player assigned to starting lineup with formation position', true, false, NOW(), NOW())
    `);
  }
}
