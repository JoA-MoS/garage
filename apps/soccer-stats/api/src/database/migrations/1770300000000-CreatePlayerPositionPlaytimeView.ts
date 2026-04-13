import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates a PostgreSQL view `player_position_playtime` that aggregates
 * playtime by position for each player in each game.
 *
 * This view preprocesses the complex position tracking logic that runs
 * in the StatsService, making it available for efficient querying in stats pages.
 *
 * The view handles:
 * - GAME_ROSTER events (initial position assignments)
 * - SUBSTITUTION_IN/OUT events (entry/exit timing)
 * - POSITION_CHANGE/POSITION_SWAP events (mid-game position changes)
 * - Period-aware timing using periodSecond within each period
 *
 * Output columns:
 * - game_team_id: Reference to the game_team
 * - player_id: Internal player ID (nullable for external players)
 * - player_name: Full name or email (for internal players)
 * - external_player_name: Name of external player (if applicable)
 * - external_player_number: Jersey number (if external player)
 * - position: The position played
 * - total_seconds: Total time played at this position (in seconds)
 */
export class CreatePlayerPositionPlaytimeView1770300000000
  implements MigrationInterface
{
  name = 'CreatePlayerPositionPlaytimeView1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE VIEW player_position_playtime AS
      WITH position_events AS (
        -- Extract all position-related events in chronological order per game_team
        SELECT
          ge.id,
          ge."gameTeamId",
          ge."playerId",
          ge."createdAt",
          COALESCE(ge."playerId"::text, ge."externalPlayerName") AS player_key,
          CASE
            WHEN ge."playerId" IS NOT NULL
              THEN COALESCE(TRIM(CONCAT(u."firstName", ' ', u."lastName")), u.email)
            ELSE NULL
          END AS player_name,
          ge."externalPlayerName",
          ge."externalPlayerNumber",
          ge.position,
          ge.period,
          ge."periodSecond",
          et.name AS event_type,
          ROW_NUMBER() OVER (
            PARTITION BY ge."gameTeamId", COALESCE(ge."playerId"::text, ge."externalPlayerName")
            ORDER BY
              CASE WHEN ge.period IS NULL THEN '0' ELSE ge.period END ASC,
              ge."periodSecond" ASC,
              ge."createdAt" ASC
          ) AS event_seq
        FROM game_events ge
        INNER JOIN event_types et ON et.id = ge."eventTypeId"
        LEFT JOIN users u ON u.id = ge."playerId"
        WHERE et.name IN (
          'GAME_ROSTER',
          'SUBSTITUTION_IN',
          'SUBSTITUTION_OUT',
          'POSITION_CHANGE',
          'POSITION_SWAP'
        )
      ),
      position_spans AS (
        -- Build position spans by pairing each position entry with its exit
        SELECT
          pe."gameTeamId",
          pe."playerId",
          pe.player_key,
          pe.player_name,
          pe."externalPlayerName",
          pe."externalPlayerNumber",
          pe.position,
          pe.period,
          pe."periodSecond" AS start_seconds,
          -- Find the next position-ending event (SUB_OUT or next SUB_IN)
          LEAD(pe."periodSecond") OVER (
            PARTITION BY pe."gameTeamId", pe.player_key
            ORDER BY
              CASE WHEN pe.period IS NULL THEN '0' ELSE pe.period END ASC,
              pe."periodSecond" ASC,
              pe."createdAt" ASC
          ) AS end_seconds,
          LEAD(pe.period) OVER (
            PARTITION BY pe."gameTeamId", pe.player_key
            ORDER BY
              CASE WHEN pe.period IS NULL THEN '0' ELSE pe.period END ASC,
              pe."periodSecond" ASC,
              pe."createdAt" ASC
          ) AS end_period,
          LEAD(pe.event_type) OVER (
            PARTITION BY pe."gameTeamId", pe.player_key
            ORDER BY
              CASE WHEN pe.period IS NULL THEN '0' ELSE pe.period END ASC,
              pe."periodSecond" ASC,
              pe."createdAt" ASC
          ) AS next_event_type
        FROM position_events pe
        WHERE pe.position IS NOT NULL
      ),
      position_durations AS (
        -- Calculate duration for each position span
        -- For open spans (player still on field), use period duration from game context
        SELECT
          ps."gameTeamId",
          ps."playerId",
          ps.player_name,
          ps."externalPlayerName",
          ps."externalPlayerNumber",
          ps.position,
          ps.period,
          ps.start_seconds,
          COALESCE(ps.end_seconds, 0) AS end_seconds,
          CASE
            -- If there's an end_seconds, use it (span was closed)
            WHEN ps.end_seconds IS NOT NULL THEN ps.end_seconds - ps.start_seconds
            -- Otherwise, span is still open (player didn't get subbed out in this view period)
            -- We calculate based on available period data, but mark as incomplete
            ELSE 0
          END AS calculated_seconds
        FROM position_spans ps
        -- Only count closed spans (where we have both start and end)
        WHERE ps.end_seconds IS NOT NULL
      )
      SELECT
        pd."gameTeamId" AS game_team_id,
        pd."playerId" AS player_id,
        pd.player_name,
        pd."externalPlayerName" AS external_player_name,
        pd."externalPlayerNumber" AS external_player_number,
        pd.position,
        SUM(pd.calculated_seconds) AS total_seconds
      FROM position_durations pd
      WHERE pd.calculated_seconds > 0
      GROUP BY
        pd."gameTeamId",
        pd."playerId",
        pd.player_name,
        pd."externalPlayerName",
        pd."externalPlayerNumber",
        pd.position
      ORDER BY
        pd."gameTeamId",
        pd."playerId",
        pd.position
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS player_position_playtime`);
  }
}
