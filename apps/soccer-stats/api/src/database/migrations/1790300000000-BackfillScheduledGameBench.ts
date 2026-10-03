import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Games now start with every active player on the bench (GameBenchService).
 * Games scheduled before that - including calendar imports - started with an
 * empty bench, so this gives the ones not yet kicked off the same start:
 * each active player not already in the game goes on its bench.
 *
 * Entries are recorded under the team's owner, else a manager, else a
 * coach, as for calendar imports. Teams with none of those are skipped.
 */
export class BackfillScheduledGameBench1790300000000
  implements MigrationInterface
{
  name = 'BackfillScheduledGameBench1790300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH roster_type AS (
        SELECT id FROM event_types WHERE name = 'GAME_ROSTER'
      ),
      recorder AS (
        SELECT DISTINCT ON (tm."teamId") tm."teamId", tm."userId"
        FROM team_members tm
        JOIN team_member_roles r ON r."teamMemberId" = tm.id
        WHERE tm."isActive"
          AND r.role IN ('OWNER', 'MANAGER', 'COACH')
        ORDER BY tm."teamId",
          CASE r.role WHEN 'OWNER' THEN 0 WHEN 'MANAGER' THEN 1 ELSE 2 END,
          tm."createdAt"
      ),
      missing AS (
        SELECT gt."gameId", gt.id AS "gameTeamId", tm."userId" AS "playerId",
          rec."userId" AS "recordedByUserId"
        FROM games g
        JOIN game_teams gt ON gt."gameId" = g.id
        JOIN team_members tm ON tm."teamId" = gt."teamId" AND tm."isActive"
        JOIN team_member_roles r
          ON r."teamMemberId" = tm.id AND r.role = 'PLAYER'
        JOIN recorder rec ON rec."teamId" = gt."teamId"
        WHERE g.status = 'SCHEDULED'
          AND NOT EXISTS (
            SELECT 1 FROM game_events e
            WHERE e."gameTeamId" = gt.id
              AND e."eventTypeId" = (SELECT id FROM roster_type)
              AND e."playerId" = tm."userId"
          )
      )
      INSERT INTO game_events
        ("gameId", "gameTeamId", "eventTypeId", "playerId",
         "recordedByUserId", period, "periodSecond", position)
      SELECT m."gameId", m."gameTeamId", (SELECT id FROM roster_type),
        m."playerId", m."recordedByUserId", '1', 0, NULL
      FROM missing m
      ORDER BY m."gameTeamId", m."playerId"
    `);
  }

  public async down(): Promise<void> {
    // Data only. Once added, a bench entry can't be told apart from one a
    // coach made, so they stay.
  }
}
