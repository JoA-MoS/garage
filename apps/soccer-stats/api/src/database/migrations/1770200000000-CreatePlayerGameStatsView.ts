import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates a PostgreSQL view `player_game_stats` that pre-aggregates
 * game event data per player per game team.
 *
 * This view provides efficient access to:
 * - Goals scored per player per game
 * - Assists per player per game
 * - Yellow/red cards per player per game
 * - Game metadata (scheduled date, status, team info)
 *
 * The view is available for future use to show per-game and aggregated team
 * statistics. Currently the app reads raw events via StatsService; this view
 * can be queried directly if a reporting or caching layer is introduced.
 *
 * Note: Playing time is NOT included in this view because it requires
 * sequential event processing (tracking position spans across SUB_IN/SUB_OUT
 * events with period-relative timing). That logic remains in the StatsService.
 */
export class CreatePlayerGameStatsView1770200000000
  implements MigrationInterface
{
  name = 'CreatePlayerGameStatsView1770200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        gt."finalScore" AS final_score,

        -- Opponent info (via self-join on game_teams)
        opp_gt."teamId" AS opponent_team_id,
        opp_t.name AS opponent_team_name,
        opp_gt."finalScore" AS opponent_final_score,

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
        g."scheduledStart", g.status, g.name, gt."finalScore",
        opp_gt."teamId", opp_t.name, opp_gt."finalScore"
    `);

    // Create a team-level aggregate view for quick team summary stats
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS team_stats_summary`);
    await queryRunner.query(`DROP VIEW IF EXISTS player_game_stats`);
  }
}
