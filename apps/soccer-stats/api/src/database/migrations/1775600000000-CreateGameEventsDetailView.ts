import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the `game_events_detail` view — a human-readable projection of
 * game events with all related entity names resolved instead of raw UUIDs.
 *
 * Useful for ad-hoc queries, debugging, and reporting without having to
 * manually join 8 tables every time.
 *
 * Output columns:
 *
 * Event identification:
 *   - event_id, created_at, updated_at
 *
 * Event type:
 *   - event_type        — e.g. 'GOAL', 'YELLOW_CARD', 'SUBSTITUTION_IN'
 *   - event_category    — e.g. 'SCORING', 'DISCIPLINARY', 'SUBSTITUTION'
 *
 * Game context:
 *   - game_id, game_name, game_date, game_status, venue, game_format
 *
 * Team context:
 *   - game_team_id, team_id, team_name, team_type ('home' | 'away')
 *
 * Player:
 *   - player_id           — UUID for internal players, NULL for external
 *   - player_name         — full name for internal, externalPlayerName for external
 *   - player_number       — jersey number (external players only)
 *   - is_external_player  — true when player is not a registered user
 *
 * Recorder:
 *   - recorded_by_user_id, recorded_by_name
 *
 * Parent event (e.g. the GOAL that an ASSIST belongs to):
 *   - parent_event_id, parent_event_type
 *
 * Additional:
 *   - period, period_second, position, formation, description, conflict_id
 */
export class CreateGameEventsDetailView1775600000000
  implements MigrationInterface
{
  name = 'CreateGameEventsDetailView1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE VIEW game_events_detail AS
      SELECT
        -- Event identification
        ge.id                                                     AS event_id,
        ge."createdAt"                                            AS created_at,
        ge."updatedAt"                                            AS updated_at,

        -- Event type
        et.name                                                   AS event_type,
        et.category                                               AS event_category,

        -- Timing
        ge.period,
        ge."periodSecond"                                         AS period_second,

        -- Game context
        g.id                                                      AS game_id,
        COALESCE(
          g.name,
          'Game on ' || TO_CHAR(g."scheduledStart", 'YYYY-MM-DD')
        )                                                         AS game_name,
        g."scheduledStart"                                        AS game_date,
        g.status                                                  AS game_status,
        g.venue,
        gf.name                                                   AS game_format,

        -- Team context
        gt.id                                                     AS game_team_id,
        t.id                                                      AS team_id,
        t.name                                                    AS team_name,
        gt."teamType"                                             AS team_type,

        -- Player (internal or external)
        ge."playerId"                                             AS player_id,
        CASE
          WHEN ge."playerId" IS NOT NULL
            THEN TRIM(CONCAT(pu."firstName", ' ', pu."lastName"))
          ELSE ge."externalPlayerName"
        END                                                       AS player_name,
        ge."externalPlayerNumber"                                 AS player_number,
        (ge."playerId" IS NULL AND ge."externalPlayerName" IS NOT NULL)
                                                                  AS is_external_player,

        -- Recorder
        ge."recordedByUserId"                                     AS recorded_by_user_id,
        TRIM(CONCAT(ru."firstName", ' ', ru."lastName"))          AS recorded_by_name,

        -- Parent event (e.g. the GOAL an ASSIST belongs to)
        ge."parentEventId"                                        AS parent_event_id,
        pet.name                                                  AS parent_event_type,

        -- Additional context
        ge.position,
        ge.formation,
        ge.description,
        ge."conflictId"                                           AS conflict_id

      FROM game_events ge
      INNER JOIN event_types et   ON et.id  = ge."eventTypeId"
      INNER JOIN game_teams  gt   ON gt.id  = ge."gameTeamId"
      INNER JOIN games       g    ON g.id   = ge."gameId"
      INNER JOIN game_formats gf  ON gf.id  = g."gameFormatId"
      INNER JOIN teams       t    ON t.id   = gt."teamId"
      LEFT  JOIN users       pu   ON pu.id  = ge."playerId"
      INNER JOIN users       ru   ON ru.id  = ge."recordedByUserId"
      LEFT  JOIN game_events pe   ON pe.id  = ge."parentEventId"
      LEFT  JOIN event_types pet  ON pet.id = pe."eventTypeId"
      ORDER BY
        ge."gameId",
        CASE WHEN ge.period IS NULL THEN '0' ELSE ge.period END ASC,
        ge."periodSecond" ASC,
        ge."createdAt" ASC
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS game_events_detail`);
  }
}
