import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the denormalized `finalScore` column from `game_teams` and
 * updates the `player_game_stats` and `team_stats_summary` views to
 * derive scores from GOAL events — the authoritative source of truth.
 *
 * Background:
 *   - `finalScore` was incremented/decremented by goal events, but this
 *     dual-tracking caused bugs (0-score teams left NULL, required COALESCE
 *     guards throughout stats queries).
 *   - All query-time score computation now counts GOAL events directly.
 *   - The GraphQL `GameTeam.finalScore` field is now a computed resolver
 *     backed by a DataLoader that counts GOAL events per game team.
 */
export class RemoveFinalScoreColumn1776000000000 implements MigrationInterface {
  name = 'RemoveFinalScoreColumn1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the views that reference finalScore before altering the table
    await queryRunner.query(`DROP VIEW IF EXISTS team_stats_summary`);
    await queryRunner.query(`DROP VIEW IF EXISTS player_game_stats`);

    // Drop the finalScore column
    await queryRunner.query(
      `ALTER TABLE "game_teams" DROP COLUMN "finalScore"`,
    );

    // Recreate player_game_stats view — score derived from GOAL event count
    await queryRunner.query(`
      CREATE OR REPLACE VIEW player_game_stats AS
      SELECT
        -- Player identification
        COALESCE(ge."playerId"::text, ge."externalPlayerName") AS player_key,
        ge."playerId" AS player_id,
        CASE
          WHEN ge."playerId" IS NOT NULL
            THEN COALESCE(TRIM(CONCAT(u."firstName", ' ', u."lastName")), u.email)
          ELSE NULL
        END AS player_name,
        ge."externalPlayerName" AS external_player_name,
        ge."externalPlayerNumber" AS external_player_number,

        -- Game context
        gt.id AS game_team_id,
        gt."gameId" AS game_id,
        gt."teamId" AS team_id,
        gt."teamType" AS team_type,
        g."scheduledStart" AS game_date,
        g.status AS game_status,
        g.name AS game_name,

        -- Final score derived from GOAL events
        (
          SELECT COUNT(*)
          FROM game_events gs
          INNER JOIN event_types gset ON gset.id = gs."eventTypeId"
          WHERE gs."gameTeamId" = gt.id
            AND gset.name = 'GOAL'
        )::int AS final_score,

        -- Opponent info (via self-join on game_teams)
        opp_gt."teamId" AS opponent_team_id,
        opp_t.name AS opponent_team_name,
        (
          SELECT COUNT(*)
          FROM game_events os
          INNER JOIN event_types oset ON oset.id = os."eventTypeId"
          WHERE os."gameTeamId" = opp_gt.id
            AND oset.name = 'GOAL'
        )::int AS opponent_final_score,

        -- Aggregated event counts
        COUNT(*) FILTER (WHERE et.name = 'GOAL') AS goals,
        COUNT(*) FILTER (WHERE et.name = 'ASSIST') AS assists,
        COUNT(*) FILTER (WHERE et.name = 'YELLOW_CARD') AS yellow_cards,
        COUNT(*) FILTER (WHERE et.name = 'RED_CARD') AS red_cards,
        COUNT(*) FILTER (WHERE et.name = 'SECOND_YELLOW') AS second_yellows,
        COUNT(*) FILTER (WHERE et.name = 'OWN_GOAL') AS own_goals,

        -- Participation flag (any event for this player in this game)
        TRUE AS participated

      FROM game_events ge
      INNER JOIN event_types et ON et.id = ge."eventTypeId"
      INNER JOIN game_teams gt ON gt.id = ge."gameTeamId"
      INNER JOIN games g ON g.id = gt."gameId"
      LEFT JOIN users u ON u.id = ge."playerId"
      -- Self-join to get opponent team in the same game
      LEFT JOIN game_teams opp_gt ON opp_gt."gameId" = gt."gameId" AND opp_gt.id != gt.id
      LEFT JOIN teams opp_t ON opp_t.id = opp_gt."teamId"
      WHERE et.name IN (
        'GOAL', 'ASSIST', 'OWN_GOAL',
        'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW',
        'SUBSTITUTION_IN', 'GAME_ROSTER'
      )
      GROUP BY
        COALESCE(ge."playerId"::text, ge."externalPlayerName"),
        ge."playerId",
        u."firstName", u."lastName", u.email,
        ge."externalPlayerName",
        ge."externalPlayerNumber",
        gt.id, gt."gameId", gt."teamId", gt."teamType",
        g."scheduledStart", g.status, g.name,
        opp_gt.id, opp_gt."teamId", opp_t.name
    `);

    // Recreate team_stats_summary view — score derived from GOAL event count
    await queryRunner.query(`
      CREATE OR REPLACE VIEW team_stats_summary AS
      SELECT
        gt."teamId" AS team_id,
        COUNT(DISTINCT gt.id) AS games_played,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = gt.id AND et.name = 'GOAL'
          ) > (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = opp_gt.id AND et.name = 'GOAL'
          )
        ) AS wins,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = gt.id AND et.name = 'GOAL'
          ) = (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = opp_gt.id AND et.name = 'GOAL'
          )
        ) AS draws,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = gt.id AND et.name = 'GOAL'
          ) < (
            SELECT COUNT(*)
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = opp_gt.id AND et.name = 'GOAL'
          )
        ) AS losses,
        COALESCE((
          SELECT SUM(goal_counts.cnt)
          FROM (
            SELECT COUNT(*) AS cnt
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = gt.id AND et.name = 'GOAL'
          ) goal_counts
        ), 0) AS total_goals_for,
        COALESCE((
          SELECT SUM(opp_counts.cnt)
          FROM (
            SELECT COUNT(*) AS cnt
            FROM game_events ge
            INNER JOIN event_types et ON et.id = ge."eventTypeId"
            WHERE ge."gameTeamId" = opp_gt.id AND et.name = 'GOAL'
          ) opp_counts
        ), 0) AS total_goals_against
      FROM game_teams gt
      INNER JOIN games g ON g.id = gt."gameId"
      LEFT JOIN game_teams opp_gt ON opp_gt."gameId" = gt."gameId" AND opp_gt.id != gt.id
      WHERE g.status IN ('COMPLETED', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'IN_PROGRESS')
      GROUP BY gt."teamId", gt.id, opp_gt.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the updated views
    await queryRunner.query(`DROP VIEW IF EXISTS team_stats_summary`);
    await queryRunner.query(`DROP VIEW IF EXISTS player_game_stats`);

    // Re-add the finalScore column
    await queryRunner.query(
      `ALTER TABLE "game_teams" ADD COLUMN "finalScore" integer NOT NULL DEFAULT 0`,
    );

    // Backfill from GOAL events
    await queryRunner.query(`
      UPDATE game_teams gt
      SET "finalScore" = (
        SELECT COUNT(*)
        FROM game_events ge
        INNER JOIN event_types et ON et.id = ge."eventTypeId"
        WHERE ge."gameTeamId" = gt.id
          AND et.name = 'GOAL'
      )
    `);

    // Restore original player_game_stats view
    await queryRunner.query(`
      CREATE OR REPLACE VIEW player_game_stats AS
      SELECT
        COALESCE(ge."playerId"::text, ge."externalPlayerName") AS player_key,
        ge."playerId" AS player_id,
        CASE
          WHEN ge."playerId" IS NOT NULL
            THEN COALESCE(TRIM(CONCAT(u."firstName", ' ', u."lastName")), u.email)
          ELSE NULL
        END AS player_name,
        ge."externalPlayerName" AS external_player_name,
        ge."externalPlayerNumber" AS external_player_number,
        gt.id AS game_team_id,
        gt."gameId" AS game_id,
        gt."teamId" AS team_id,
        gt."teamType" AS team_type,
        g."scheduledStart" AS game_date,
        g.status AS game_status,
        g.name AS game_name,
        gt."finalScore" AS final_score,
        opp_gt."teamId" AS opponent_team_id,
        opp_t.name AS opponent_team_name,
        opp_gt."finalScore" AS opponent_final_score,
        COUNT(*) FILTER (WHERE et.name = 'GOAL') AS goals,
        COUNT(*) FILTER (WHERE et.name = 'ASSIST') AS assists,
        COUNT(*) FILTER (WHERE et.name = 'YELLOW_CARD') AS yellow_cards,
        COUNT(*) FILTER (WHERE et.name = 'RED_CARD') AS red_cards,
        COUNT(*) FILTER (WHERE et.name = 'SECOND_YELLOW') AS second_yellows,
        COUNT(*) FILTER (WHERE et.name = 'OWN_GOAL') AS own_goals,
        TRUE AS participated
      FROM game_events ge
      INNER JOIN event_types et ON et.id = ge."eventTypeId"
      INNER JOIN game_teams gt ON gt.id = ge."gameTeamId"
      INNER JOIN games g ON g.id = gt."gameId"
      LEFT JOIN users u ON u.id = ge."playerId"
      LEFT JOIN game_teams opp_gt ON opp_gt."gameId" = gt."gameId" AND opp_gt.id != gt.id
      LEFT JOIN teams opp_t ON opp_t.id = opp_gt."teamId"
      WHERE et.name IN (
        'GOAL', 'ASSIST', 'OWN_GOAL',
        'YELLOW_CARD', 'RED_CARD', 'SECOND_YELLOW',
        'SUBSTITUTION_IN', 'GAME_ROSTER'
      )
      GROUP BY
        COALESCE(ge."playerId"::text, ge."externalPlayerName"),
        ge."playerId",
        u."firstName", u."lastName", u.email,
        ge."externalPlayerName",
        ge."externalPlayerNumber",
        gt.id, gt."gameId", gt."teamId", gt."teamType",
        g."scheduledStart", g.status, g.name, gt."finalScore",
        opp_gt."teamId", opp_t.name, opp_gt."finalScore"
    `);

    // Restore original team_stats_summary view
    await queryRunner.query(`
      CREATE OR REPLACE VIEW team_stats_summary AS
      SELECT
        gt."teamId" AS team_id,
        COUNT(DISTINCT gt.id) AS games_played,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE gt."finalScore" IS NOT NULL
            AND opp_gt."finalScore" IS NOT NULL
            AND gt."finalScore" > opp_gt."finalScore"
        ) AS wins,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE gt."finalScore" IS NOT NULL
            AND opp_gt."finalScore" IS NOT NULL
            AND gt."finalScore" = opp_gt."finalScore"
        ) AS draws,
        COUNT(DISTINCT gt.id) FILTER (
          WHERE gt."finalScore" IS NOT NULL
            AND opp_gt."finalScore" IS NOT NULL
            AND gt."finalScore" < opp_gt."finalScore"
        ) AS losses,
        COALESCE(SUM(gt."finalScore"), 0) AS total_goals_for,
        COALESCE(SUM(opp_gt."finalScore"), 0) AS total_goals_against
      FROM game_teams gt
      INNER JOIN games g ON g.id = gt."gameId"
      LEFT JOIN game_teams opp_gt ON opp_gt."gameId" = gt."gameId" AND opp_gt.id != gt.id
      WHERE g.status IN ('COMPLETED', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'IN_PROGRESS')
      GROUP BY gt."teamId"
    `);
  }
}
