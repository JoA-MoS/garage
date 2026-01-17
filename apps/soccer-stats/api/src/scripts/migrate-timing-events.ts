/**
 * Migration script to convert legacy timing events to the new event-based model.
 *
 * This script:
 * 1. Connects to the database
 * 2. Migrates existing timing events to new format:
 *    - KICKOFF → GAME_START + PERIOD_START (period: "1")
 *    - HALFTIME → PERIOD_END (period: "1")
 *    - FULL_TIME → GAME_END + PERIOD_END (period: "2")
 * 3. Deletes INJURY_STOPPAGE events (no equivalent in new model)
 * 4. Removes old event types from the database
 *
 * Usage:
 *   # Development (uses local .env)
 *   pnpm nx migrate:timing-events soccer-stats-api
 *
 *   # Dry run (no changes, just report what would happen)
 *   DRY_RUN=true pnpm nx migrate:timing-events soccer-stats-api
 *
 *   # Production (set env vars first)
 *   DB_HOST=xxx pnpm nx migrate:timing-events soccer-stats-api
 */

import { randomUUID } from 'crypto';

import { Client } from 'pg';

// Load .env file if present (for local development)
try {
  require('dotenv').config();
} catch {
  /* dotenv not installed - using env vars */
}

// Legacy event type names to migrate
const LEGACY_EVENT_TYPES = {
  KICKOFF: 'KICKOFF',
  HALFTIME: 'HALFTIME',
  FULL_TIME: 'FULL_TIME',
  INJURY_STOPPAGE: 'INJURY_STOPPAGE',
} as const;

// New event type names
const NEW_EVENT_TYPES = {
  GAME_START: 'GAME_START',
  GAME_END: 'GAME_END',
  PERIOD_START: 'PERIOD_START',
  PERIOD_END: 'PERIOD_END',
} as const;

interface EventType {
  id: string;
  name: string;
}

interface GameEvent {
  id: string;
  gameTeamId: string;
  eventTypeId: string;
  gameMinute: number;
  gameSecond: number;
  createdAt: Date;
  recordedByUserId: string | null;
}

interface MigrationStats {
  kickoffsConverted: number;
  halftimesConverted: number;
  fullTimesConverted: number;
  stoppagesDeleted: number;
  newEventsCreated: number;
  oldTypesDeleted: number;
}

async function main() {
  const isDryRun = process.env.DRY_RUN === 'true';

  console.log('='.repeat(60));
  console.log('Timing Events Migration Script');
  console.log('='.repeat(60));
  if (isDryRun) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'soccer_stats',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  const stats: MigrationStats = {
    kickoffsConverted: 0,
    halftimesConverted: 0,
    fullTimesConverted: 0,
    stoppagesDeleted: 0,
    newEventsCreated: 0,
    oldTypesDeleted: 0,
  };

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Start transaction
    if (!isDryRun) {
      await client.query('BEGIN');
    }

    // Step 1: Get all event types we need
    console.log('Step 1: Loading event types...');
    const eventTypesResult = await client.query<EventType>(
      'SELECT id, name FROM event_types WHERE name = ANY($1)',
      [
        [
          ...Object.values(LEGACY_EVENT_TYPES),
          ...Object.values(NEW_EVENT_TYPES),
        ],
      ],
    );

    const eventTypeMap = new Map<string, string>();
    for (const et of eventTypesResult.rows) {
      eventTypeMap.set(et.name, et.id);
    }

    // Check for legacy event types
    const hasLegacyTypes = Object.values(LEGACY_EVENT_TYPES).some((name) =>
      eventTypeMap.has(name),
    );

    if (!hasLegacyTypes) {
      console.log(
        '\nNo legacy event types found. Migration may have already been completed.',
      );
      console.log(
        'Legacy types checked: ' + Object.values(LEGACY_EVENT_TYPES).join(', '),
      );
      return;
    }

    // Check for new event types (should exist from seedDefaultEventTypes or ensureNewEventTypesExist)
    const missingNewTypes = Object.values(NEW_EVENT_TYPES).filter(
      (name) => !eventTypeMap.has(name),
    );
    if (missingNewTypes.length > 0) {
      console.error(
        `ERROR: Missing new event types: ${missingNewTypes.join(', ')}`,
      );
      console.error(
        'Run the API server first to create new event types via ensureNewEventTypesExist()',
      );
      process.exit(1);
    }

    console.log(`  Found ${eventTypeMap.size} relevant event types`);

    // Step 2: Migrate KICKOFF events → GAME_START + PERIOD_START
    const kickoffTypeId = eventTypeMap.get(LEGACY_EVENT_TYPES.KICKOFF);
    if (kickoffTypeId) {
      console.log('\nStep 2: Migrating KICKOFF events...');
      const kickoffEvents = await client.query<GameEvent>(
        `SELECT id, "gameTeamId", "eventTypeId", "gameMinute", "gameSecond",
                "createdAt", "recordedByUserId"
         FROM game_events WHERE "eventTypeId" = $1`,
        [kickoffTypeId],
      );

      console.log(`  Found ${kickoffEvents.rows.length} KICKOFF events`);

      for (const event of kickoffEvents.rows) {
        if (!isDryRun) {
          // Update existing event to GAME_START
          await client.query(
            `UPDATE game_events SET "eventTypeId" = $1 WHERE id = $2`,
            [eventTypeMap.get(NEW_EVENT_TYPES.GAME_START), event.id],
          );

          // Create new PERIOD_START event with same timestamp
          await client.query(
            `INSERT INTO game_events
             (id, "gameTeamId", "eventTypeId", "gameMinute", "gameSecond",
              "createdAt", "recordedByUserId", metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              randomUUID(),
              event.gameTeamId,
              eventTypeMap.get(NEW_EVENT_TYPES.PERIOD_START),
              event.gameMinute,
              event.gameSecond,
              event.createdAt,
              event.recordedByUserId,
              JSON.stringify({ period: '1' }),
            ],
          );
          stats.newEventsCreated++;
        }
        stats.kickoffsConverted++;
      }
      console.log(`  Converted ${stats.kickoffsConverted} KICKOFF events`);
    }

    // Step 3: Migrate HALFTIME events → PERIOD_END (period: "1")
    const halftimeTypeId = eventTypeMap.get(LEGACY_EVENT_TYPES.HALFTIME);
    if (halftimeTypeId) {
      console.log('\nStep 3: Migrating HALFTIME events...');
      const halftimeEvents = await client.query<GameEvent>(
        `SELECT id FROM game_events WHERE "eventTypeId" = $1`,
        [halftimeTypeId],
      );

      console.log(`  Found ${halftimeEvents.rows.length} HALFTIME events`);

      if (!isDryRun && halftimeEvents.rows.length > 0) {
        // Update all HALFTIME events to PERIOD_END with period: "1"
        await client.query(
          `UPDATE game_events
           SET "eventTypeId" = $1, metadata = $2
           WHERE "eventTypeId" = $3`,
          [
            eventTypeMap.get(NEW_EVENT_TYPES.PERIOD_END),
            JSON.stringify({ period: '1' }),
            halftimeTypeId,
          ],
        );
      }
      stats.halftimesConverted = halftimeEvents.rows.length;
      console.log(`  Converted ${stats.halftimesConverted} HALFTIME events`);
    }

    // Step 4: Migrate FULL_TIME events → GAME_END + PERIOD_END (period: "2")
    const fullTimeTypeId = eventTypeMap.get(LEGACY_EVENT_TYPES.FULL_TIME);
    if (fullTimeTypeId) {
      console.log('\nStep 4: Migrating FULL_TIME events...');
      const fullTimeEvents = await client.query<GameEvent>(
        `SELECT id, "gameTeamId", "eventTypeId", "gameMinute", "gameSecond",
                "createdAt", "recordedByUserId"
         FROM game_events WHERE "eventTypeId" = $1`,
        [fullTimeTypeId],
      );

      console.log(`  Found ${fullTimeEvents.rows.length} FULL_TIME events`);

      for (const event of fullTimeEvents.rows) {
        if (!isDryRun) {
          // Update existing event to GAME_END
          await client.query(
            `UPDATE game_events SET "eventTypeId" = $1 WHERE id = $2`,
            [eventTypeMap.get(NEW_EVENT_TYPES.GAME_END), event.id],
          );

          // Create new PERIOD_END event with period: "2"
          await client.query(
            `INSERT INTO game_events
             (id, "gameTeamId", "eventTypeId", "gameMinute", "gameSecond",
              "createdAt", "recordedByUserId", metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              randomUUID(),
              event.gameTeamId,
              eventTypeMap.get(NEW_EVENT_TYPES.PERIOD_END),
              event.gameMinute,
              event.gameSecond,
              event.createdAt,
              event.recordedByUserId,
              JSON.stringify({ period: '2' }),
            ],
          );
          stats.newEventsCreated++;
        }
        stats.fullTimesConverted++;
      }
      console.log(`  Converted ${stats.fullTimesConverted} FULL_TIME events`);
    }

    // Step 5: Delete INJURY_STOPPAGE events (no equivalent in new model)
    const stoppageTypeId = eventTypeMap.get(LEGACY_EVENT_TYPES.INJURY_STOPPAGE);
    if (stoppageTypeId) {
      console.log('\nStep 5: Deleting INJURY_STOPPAGE events...');
      const stoppageEvents = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM game_events WHERE "eventTypeId" = $1`,
        [stoppageTypeId],
      );

      stats.stoppagesDeleted = parseInt(stoppageEvents.rows[0].count, 10);
      console.log(`  Found ${stats.stoppagesDeleted} INJURY_STOPPAGE events`);

      if (!isDryRun && stats.stoppagesDeleted > 0) {
        await client.query(`DELETE FROM game_events WHERE "eventTypeId" = $1`, [
          stoppageTypeId,
        ]);
      }
      console.log(`  Deleted ${stats.stoppagesDeleted} INJURY_STOPPAGE events`);
    }

    // Step 6: Delete old event types
    console.log('\nStep 6: Removing legacy event types...');
    const legacyTypeIds = Object.values(LEGACY_EVENT_TYPES)
      .map((name) => eventTypeMap.get(name))
      .filter(Boolean);

    if (legacyTypeIds.length > 0 && !isDryRun) {
      const deleteResult = await client.query(
        `DELETE FROM event_types WHERE id = ANY($1)`,
        [legacyTypeIds],
      );
      stats.oldTypesDeleted = deleteResult.rowCount || 0;
    } else {
      stats.oldTypesDeleted = legacyTypeIds.length;
    }
    console.log(`  Removed ${stats.oldTypesDeleted} legacy event types`);

    // Commit transaction
    if (!isDryRun) {
      await client.query('COMMIT');
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(
      `  KICKOFF → GAME_START + PERIOD_START: ${stats.kickoffsConverted}`,
    );
    console.log(
      `  HALFTIME → PERIOD_END (period: "1"): ${stats.halftimesConverted}`,
    );
    console.log(
      `  FULL_TIME → GAME_END + PERIOD_END (period: "2"): ${stats.fullTimesConverted}`,
    );
    console.log(`  INJURY_STOPPAGE deleted: ${stats.stoppagesDeleted}`);
    console.log(`  New events created: ${stats.newEventsCreated}`);
    console.log(`  Legacy event types removed: ${stats.oldTypesDeleted}`);

    console.log('\n' + '='.repeat(60));
    if (isDryRun) {
      console.log('DRY RUN COMPLETE - No changes were made');
      console.log('Run without DRY_RUN=true to apply changes');
    } else {
      console.log('Migration complete!');
    }
    console.log('='.repeat(60));
  } catch (error) {
    // Rollback on error
    if (!isDryRun) {
      try {
        await client.query('ROLLBACK');
        console.error('\nTransaction rolled back due to error');
      } catch {
        /* ignore rollback errors */
      }
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
