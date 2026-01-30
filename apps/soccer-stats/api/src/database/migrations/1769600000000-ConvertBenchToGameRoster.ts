import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts BENCH events to GAME_ROSTER and backfills starters.
 *
 * This migration does two things:
 * 1. Converts all existing BENCH events to GAME_ROSTER events (same data, different type)
 * 2. Creates new GAME_ROSTER events for players who were starters (had SUBSTITUTION_IN
 *    at period 1, second 0) but didn't have a BENCH event
 *
 * Rationale:
 * - In the old model: bench players got BENCH events, starters only got SUBSTITUTION_IN
 * - In the new model: ALL players in the game roster get GAME_ROSTER events
 *   - position IS NOT NULL → planned starter at that position
 *   - position IS NULL → on the bench
 */
export class ConvertBenchToGameRoster1769600000000
  implements MigrationInterface
{
  name = 'ConvertBenchToGameRoster1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Convert existing BENCH events to GAME_ROSTER
    await queryRunner.query(`
      UPDATE game_events
      SET "eventTypeId" = (SELECT id FROM event_types WHERE name = 'GAME_ROSTER')
      WHERE "eventTypeId" = (SELECT id FROM event_types WHERE name = 'BENCH')
    `);

    // Step 2: Create GAME_ROSTER events for existing starters (SUBSTITUTION_IN at period 1, sec 0)
    // who don't already have a GAME_ROSTER event
    await queryRunner.query(`
      INSERT INTO game_events (
        id, "gameId", "gameTeamId", "eventTypeId", "playerId",
        "externalPlayerName", "externalPlayerNumber", "position", "recordedByUserId",
        "gameMinute", "gameSecond", "period", "periodSecond", "createdAt", "updatedAt"
      )
      SELECT
        uuid_generate_v4(),
        ge."gameId",
        ge."gameTeamId",
        (SELECT id FROM event_types WHERE name = 'GAME_ROSTER'),
        ge."playerId",
        ge."externalPlayerName",
        ge."externalPlayerNumber",
        ge."position",
        ge."recordedByUserId",
        0, 0, '1', 0,
        ge."createdAt",
        NOW()
      FROM game_events ge
      JOIN event_types et ON ge."eventTypeId" = et.id
      WHERE et.name = 'SUBSTITUTION_IN'
        AND ge.period = '1'
        AND ge."periodSecond" = 0
        AND NOT EXISTS (
          SELECT 1 FROM game_events gr
          JOIN event_types grt ON gr."eventTypeId" = grt.id
          WHERE grt.name = 'GAME_ROSTER'
            AND gr."gameTeamId" = ge."gameTeamId"
            AND (
              (gr."playerId" IS NOT NULL AND gr."playerId" = ge."playerId")
              OR (gr."externalPlayerName" IS NOT NULL AND gr."externalPlayerName" = ge."externalPlayerName")
            )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert GAME_ROSTER back to BENCH (only the ones that were originally BENCH)
    // Note: This is a lossy rollback - we can't distinguish original BENCH from backfilled starters
    await queryRunner.query(`
      UPDATE game_events
      SET "eventTypeId" = (SELECT id FROM event_types WHERE name = 'BENCH')
      WHERE "eventTypeId" = (SELECT id FROM event_types WHERE name = 'GAME_ROSTER')
    `);
  }
}
