import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Data migration to convert legacy timing events to the new event-based model.
 *
 * This migration is self-contained:
 *   1. Creates new timing event types if they don't exist
 *   2. Converts legacy events to new format
 *   3. Removes legacy event types
 *
 * Conversions:
 *   - KICKOFF → GAME_START + PERIOD_START (period: "1")
 *   - HALFTIME → PERIOD_END (period: "1")
 *   - FULL_TIME → GAME_END + PERIOD_END (period: "2")
 *   - INJURY_STOPPAGE → Deleted (lacks start/end timing for STOPPAGE_START/END pairs)
 *
 * Note: The down() migration recreates legacy event types but cannot fully restore
 * deleted INJURY_STOPPAGE events or the exact original state of converted events.
 */
export class MigrateTimingEvents1768674674895 implements MigrationInterface {
  name = 'MigrateTimingEvents1768674674895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 0: Create new timing event types if they don't exist
    const timingEventTypes = [
      {
        name: 'GAME_START',
        category: 'GAME_FLOW',
        description: 'Game officially begins',
      },
      {
        name: 'GAME_END',
        category: 'GAME_FLOW',
        description: 'Game officially ends',
      },
      {
        name: 'PERIOD_START',
        category: 'GAME_FLOW',
        description:
          'Period begins (metadata.period indicates which: "1", "2", "OT1", etc.)',
      },
      {
        name: 'PERIOD_END',
        category: 'GAME_FLOW',
        description:
          'Period ends (metadata.period indicates which: "1", "2", "OT1", etc.)',
      },
      {
        name: 'STOPPAGE_START',
        category: 'GAME_FLOW',
        description:
          'Clock paused (metadata.reason optional: "injury", "weather", etc.)',
      },
      {
        name: 'STOPPAGE_END',
        category: 'GAME_FLOW',
        description: 'Clock resumes after stoppage',
      },
    ];

    for (const eventType of timingEventTypes) {
      // Use INSERT ... WHERE NOT EXISTS since there's no unique constraint on name
      await queryRunner.query(
        `INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
         SELECT uuid_generate_v4(), $1::varchar, $2, $3, false, false, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = $1::varchar)`,
        [eventType.name, eventType.category, eventType.description],
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
      // Only copy events with valid recordedByUserId (required NOT NULL column)
      await queryRunner.query(
        `INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "gameMinute", "gameSecond", "createdAt", "recordedByUserId", metadata)
         SELECT uuid_generate_v4(), "gameId", "gameTeamId", $1, "gameMinute", "gameSecond", "createdAt", "recordedByUserId", '{"period": "1"}'::json
         FROM game_events WHERE "eventTypeId" = $2 AND "recordedByUserId" IS NOT NULL`,
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
      // Only copy events with valid recordedByUserId (required NOT NULL column)
      await queryRunner.query(
        `INSERT INTO game_events (id, "gameId", "gameTeamId", "eventTypeId", "gameMinute", "gameSecond", "createdAt", "recordedByUserId", metadata)
         SELECT uuid_generate_v4(), "gameId", "gameTeamId", $1, "gameMinute", "gameSecond", "createdAt", "recordedByUserId", '{"period": "2"}'::json
         FROM game_events WHERE "eventTypeId" = $2 AND "recordedByUserId" IS NOT NULL`,
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
    // Recreate legacy event types (use INSERT ... WHERE NOT EXISTS since no unique constraint)
    const legacyTypes = [
      { name: 'KICKOFF', description: 'Game kickoff' },
      { name: 'HALFTIME', description: 'Halftime break' },
      { name: 'FULL_TIME', description: 'Full time whistle' },
      { name: 'INJURY_STOPPAGE', description: 'Play stopped for injury' },
    ];

    for (const eventType of legacyTypes) {
      await queryRunner.query(
        `INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
         SELECT uuid_generate_v4(), $1::varchar, 'GAME_FLOW', $2, false, false, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = $1::varchar)`,
        [eventType.name, eventType.description],
      );
    }

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

    // Delete new timing event types (reverse of up() which created them)
    await queryRunner.query(
      `DELETE FROM event_types WHERE name IN ('GAME_START', 'GAME_END', 'PERIOD_START', 'PERIOD_END', 'STOPPAGE_START', 'STOPPAGE_END')`,
    );
  }
}
