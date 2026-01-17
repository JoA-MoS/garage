import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data migration to convert legacy timing events to the new event-based model.
 *
 * Conversions:
 *   - KICKOFF → GAME_START + PERIOD_START (period: "1")
 *   - HALFTIME → PERIOD_END (period: "1")
 *   - FULL_TIME → GAME_END + PERIOD_END (period: "2")
 *   - INJURY_STOPPAGE → Deleted (lacks start/end timing for STOPPAGE_START/END pairs)
 *
 * Prerequisites:
 *   - New event types (GAME_START, GAME_END, PERIOD_START, PERIOD_END) must exist
 *   - These are created by ensureNewEventTypesExist() on app startup
 *
 * Note: The down() migration recreates legacy event types but cannot fully restore
 * deleted INJURY_STOPPAGE events or the exact original state of converted events.
 */
export class MigrateTimingEvents1768674674895 implements MigrationInterface {
  name = 'MigrateTimingEvents1768674674895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if new event types exist (required for migration)
    const newTypes = await queryRunner.query(
      `SELECT name FROM event_types WHERE name IN ('GAME_START', 'GAME_END', 'PERIOD_START', 'PERIOD_END')`,
    );
    const newTypeNames = new Set(newTypes.map((t: { name: string }) => t.name));

    const missingTypes = [
      'GAME_START',
      'GAME_END',
      'PERIOD_START',
      'PERIOD_END',
    ].filter((name) => !newTypeNames.has(name));

    if (missingTypes.length > 0) {
      throw new Error(
        `Missing required event types: ${missingTypes.join(', ')}. ` +
          'Run the API server first to create new event types via ensureNewEventTypesExist().',
      );
    }

    // Check if legacy event types exist (if not, migration already completed)
    const legacyTypes = await queryRunner.query(
      `SELECT id, name FROM event_types WHERE name IN ('KICKOFF', 'HALFTIME', 'FULL_TIME', 'INJURY_STOPPAGE')`,
    );

    if (legacyTypes.length === 0) {
      console.log(
        'No legacy event types found. Migration may have already been completed.',
      );
      return;
    }

    const typeMap = new Map<string, string>();
    for (const t of legacyTypes) {
      typeMap.set(t.name, t.id);
    }

    // Get new type IDs
    const newTypeRows = await queryRunner.query(
      `SELECT id, name FROM event_types WHERE name IN ('GAME_START', 'GAME_END', 'PERIOD_START', 'PERIOD_END')`,
    );
    for (const t of newTypeRows) {
      typeMap.set(t.name, t.id);
    }

    // Step 1: Migrate KICKOFF → GAME_START + PERIOD_START
    const kickoffTypeId = typeMap.get('KICKOFF');
    if (kickoffTypeId) {
      // Update existing KICKOFF events to GAME_START
      await queryRunner.query(
        `UPDATE game_events SET "eventTypeId" = $1 WHERE "eventTypeId" = $2`,
        [typeMap.get('GAME_START'), kickoffTypeId],
      );

      // Create corresponding PERIOD_START events for each former KICKOFF
      // We need to select the events that were just updated (now GAME_START)
      await queryRunner.query(
        `INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "gameMinute", "gameSecond", "createdAt", "recordedByUserId", metadata)
         SELECT uuid_generate_v4(), "gameId", "gameTeamId", $1, "gameMinute", "gameSecond", "createdAt", "recordedByUserId", '{"period": "1"}'::json
         FROM game_events WHERE "eventTypeId" = $2`,
        [typeMap.get('PERIOD_START'), typeMap.get('GAME_START')],
      );
    }

    // Step 2: Migrate HALFTIME → PERIOD_END (period: "1")
    const halftimeTypeId = typeMap.get('HALFTIME');
    if (halftimeTypeId) {
      // Update event type and merge period into existing metadata
      await queryRunner.query(
        `UPDATE game_events
         SET "eventTypeId" = $1,
             metadata = (COALESCE(metadata::jsonb, '{}'::jsonb) || '{"period": "1"}'::jsonb)::json
         WHERE "eventTypeId" = $2`,
        [typeMap.get('PERIOD_END'), halftimeTypeId],
      );
    }

    // Step 3: Migrate FULL_TIME → GAME_END + PERIOD_END (period: "2")
    const fullTimeTypeId = typeMap.get('FULL_TIME');
    if (fullTimeTypeId) {
      // First create PERIOD_END events for each FULL_TIME (before updating them)
      await queryRunner.query(
        `INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "gameMinute", "gameSecond", "createdAt", "recordedByUserId", metadata)
         SELECT uuid_generate_v4(), "gameId", "gameTeamId", $1, "gameMinute", "gameSecond", "createdAt", "recordedByUserId", '{"period": "2"}'::json
         FROM game_events WHERE "eventTypeId" = $2`,
        [typeMap.get('PERIOD_END'), fullTimeTypeId],
      );

      // Then update existing FULL_TIME events to GAME_END
      await queryRunner.query(
        `UPDATE game_events SET "eventTypeId" = $1 WHERE "eventTypeId" = $2`,
        [typeMap.get('GAME_END'), fullTimeTypeId],
      );
    }

    // Step 4: Delete INJURY_STOPPAGE events (cannot convert - lack paired timing)
    const stoppageTypeId = typeMap.get('INJURY_STOPPAGE');
    if (stoppageTypeId) {
      await queryRunner.query(
        `DELETE FROM game_events WHERE "eventTypeId" = $1`,
        [stoppageTypeId],
      );
    }

    // Step 5: Delete legacy event types
    await queryRunner.query(
      `DELETE FROM event_types WHERE name IN ('KICKOFF', 'HALFTIME', 'FULL_TIME', 'INJURY_STOPPAGE')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate legacy event types
    await queryRunner.query(`
      INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'KICKOFF', 'GAME_FLOW', 'Game kickoff', false, false, NOW(), NOW()),
        (uuid_generate_v4(), 'HALFTIME', 'GAME_FLOW', 'Halftime break', false, false, NOW(), NOW()),
        (uuid_generate_v4(), 'FULL_TIME', 'GAME_FLOW', 'Full time whistle', false, false, NOW(), NOW()),
        (uuid_generate_v4(), 'INJURY_STOPPAGE', 'GAME_FLOW', 'Play stopped for injury', false, false, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);

    // Get type IDs
    const types = await queryRunner.query(
      `SELECT id, name FROM event_types WHERE name IN ('KICKOFF', 'HALFTIME', 'FULL_TIME', 'GAME_START', 'GAME_END', 'PERIOD_START', 'PERIOD_END')`,
    );
    const typeMap = new Map<string, string>();
    for (const t of types) {
      typeMap.set(t.name, t.id);
    }

    // Revert GAME_START → KICKOFF
    const kickoffTypeId = typeMap.get('KICKOFF');
    const gameStartTypeId = typeMap.get('GAME_START');
    if (kickoffTypeId && gameStartTypeId) {
      await queryRunner.query(
        `UPDATE game_events SET "eventTypeId" = $1 WHERE "eventTypeId" = $2`,
        [kickoffTypeId, gameStartTypeId],
      );
    }

    // Delete PERIOD_START events with period "1" (these were created from KICKOFF)
    const periodStartTypeId = typeMap.get('PERIOD_START');
    if (periodStartTypeId) {
      await queryRunner.query(
        `DELETE FROM game_events WHERE "eventTypeId" = $1 AND metadata->>'period' = '1'`,
        [periodStartTypeId],
      );
    }

    // Revert PERIOD_END (period: "1") → HALFTIME
    const halftimeTypeId = typeMap.get('HALFTIME');
    const periodEndTypeId = typeMap.get('PERIOD_END');
    if (halftimeTypeId && periodEndTypeId) {
      await queryRunner.query(
        `UPDATE game_events
         SET "eventTypeId" = $1,
             metadata = metadata::jsonb - 'period'
         WHERE "eventTypeId" = $2 AND metadata->>'period' = '1'`,
        [halftimeTypeId, periodEndTypeId],
      );
    }

    // Revert GAME_END → FULL_TIME
    const fullTimeTypeId = typeMap.get('FULL_TIME');
    const gameEndTypeId = typeMap.get('GAME_END');
    if (fullTimeTypeId && gameEndTypeId) {
      await queryRunner.query(
        `UPDATE game_events SET "eventTypeId" = $1 WHERE "eventTypeId" = $2`,
        [fullTimeTypeId, gameEndTypeId],
      );
    }

    // Delete PERIOD_END events with period "2" (these were created from FULL_TIME)
    if (periodEndTypeId) {
      await queryRunner.query(
        `DELETE FROM game_events WHERE "eventTypeId" = $1 AND metadata->>'period' = '2'`,
        [periodEndTypeId],
      );
    }

    // Note: INJURY_STOPPAGE events cannot be restored as they were deleted
    console.log(
      'Warning: INJURY_STOPPAGE events were deleted during up() migration and cannot be restored.',
    );
  }
}
