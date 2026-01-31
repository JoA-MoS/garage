import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes GAME_START and GAME_END wrapper events from the event hierarchy.
 *
 * Context:
 * - GAME_START/GAME_END were originally created as parent events wrapping
 *   PERIOD_START/PERIOD_END, but this adds complexity without benefit.
 * - After this migration:
 *   - PERIOD_START (period=1) serves as the game start indicator
 *   - PERIOD_END (final period) serves as the game end indicator
 *   - Final period is determined by gameFormat.numberOfPeriods
 *
 * Migration steps:
 * 1. Unlink PERIOD_START from GAME_START parents
 * 2. Unlink PERIOD_END from GAME_END parents
 * 3. Delete all GAME_START and GAME_END events
 *
 * Note: Event types are kept in event_types table for reference data integrity.
 */
export class RemoveGameStartEndEvents1769800000000
  implements MigrationInterface
{
  name = 'RemoveGameStartEndEvents1769800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Unlink PERIOD_START events from their GAME_START parents
    await queryRunner.query(`
      UPDATE game_events
      SET "parentEventId" = NULL
      WHERE "parentEventId" IN (
        SELECT ge.id
        FROM game_events ge
        JOIN event_types et ON ge."eventTypeId" = et.id
        WHERE et.name = 'GAME_START'
      )
    `);

    // Step 2: Unlink PERIOD_END events from their GAME_END parents
    await queryRunner.query(`
      UPDATE game_events
      SET "parentEventId" = NULL
      WHERE "parentEventId" IN (
        SELECT ge.id
        FROM game_events ge
        JOIN event_types et ON ge."eventTypeId" = et.id
        WHERE et.name = 'GAME_END'
      )
    `);

    // Step 3: Delete all GAME_START and GAME_END events
    await queryRunner.query(`
      DELETE FROM game_events
      WHERE "eventTypeId" IN (
        SELECT id FROM event_types WHERE name IN ('GAME_START', 'GAME_END')
      )
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Cannot restore deleted events - data is lost
    // Re-running games through status transitions will recreate the events
    // if the old code path is restored
    console.warn(
      'RemoveGameStartEndEvents: Cannot restore deleted GAME_START/GAME_END events. ' +
        'Re-run games through status transitions to recreate them.',
    );
  }
}
