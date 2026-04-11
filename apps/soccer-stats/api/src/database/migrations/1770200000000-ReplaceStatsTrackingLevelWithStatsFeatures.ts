import { MigrationInterface, QueryRunner } from 'typeorm';

const ALL_ON =
  '{"trackGoals":true,"trackScorer":true,"trackAssists":true,"trackSubstitutions":true,"trackPositions":true}';

/**
 * Replaces the statsTrackingLevel varchar enum columns on team_configurations,
 * games, and game_teams with a statsFeatures JSON object that exposes each
 * tracking capability as an individual boolean flag.
 *
 * Mapping from old enum values:
 *   FULL             → all flags true
 *   SCORER_ONLY      → trackGoals, trackScorer, trackSubstitutions, trackPositions true; trackAssists false
 *   GOALS_ONLY       → trackGoals, trackSubstitutions, trackPositions true; trackScorer, trackAssists false
 *   SUBSTITUTION_ONLY → trackGoals, trackSubstitutions true; trackScorer, trackAssists, trackPositions false
 */
export class ReplaceStatsTrackingLevelWithStatsFeatures1770200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── team_configurations ───────────────────────────────────────────────
    // statsTrackingLevel is NOT NULL DEFAULT 'FULL', so we always have a value
    await queryRunner.query(`
      ALTER TABLE team_configurations
        ADD COLUMN "statsFeatures" json NOT NULL DEFAULT '${ALL_ON}'
    `);

    await queryRunner.query(`
      UPDATE team_configurations
      SET "statsFeatures" = CASE "statsTrackingLevel"
        WHEN 'SCORER_ONLY'      THEN '{"trackGoals":true,"trackScorer":true,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'GOALS_ONLY'       THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'SUBSTITUTION_ONLY' THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":false}'::json
        ELSE '${ALL_ON}'::json
      END
    `);

    await queryRunner.query(
      `ALTER TABLE team_configurations DROP COLUMN "statsTrackingLevel"`,
    );

    // ── games ─────────────────────────────────────────────────────────────
    // statsTrackingLevel is nullable (null = use team default)
    await queryRunner.query(`
      ALTER TABLE games ADD COLUMN "statsFeatures" json DEFAULT NULL
    `);

    await queryRunner.query(`
      UPDATE games
      SET "statsFeatures" = CASE "statsTrackingLevel"
        WHEN 'FULL'             THEN '${ALL_ON}'::json
        WHEN 'SCORER_ONLY'      THEN '{"trackGoals":true,"trackScorer":true,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'GOALS_ONLY'       THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'SUBSTITUTION_ONLY' THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":false}'::json
        ELSE NULL
      END
      WHERE "statsTrackingLevel" IS NOT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE games DROP COLUMN "statsTrackingLevel"`,
    );

    // ── game_teams ────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE game_teams ADD COLUMN "statsFeatures" json DEFAULT NULL
    `);

    await queryRunner.query(`
      UPDATE game_teams
      SET "statsFeatures" = CASE "statsTrackingLevel"
        WHEN 'FULL'             THEN '${ALL_ON}'::json
        WHEN 'SCORER_ONLY'      THEN '{"trackGoals":true,"trackScorer":true,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'GOALS_ONLY'       THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":true}'::json
        WHEN 'SUBSTITUTION_ONLY' THEN '{"trackGoals":true,"trackScorer":false,"trackAssists":false,"trackSubstitutions":true,"trackPositions":false}'::json
        ELSE NULL
      END
      WHERE "statsTrackingLevel" IS NOT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE game_teams DROP COLUMN "statsTrackingLevel"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Exact reverse of the up() mappings. Configurations that have no
    // equivalent old enum value (e.g. trackGoals=false) fall back to 'FULL'
    // rather than silently mapping to a semantically wrong value.
    const teamConfigCase = `
      CASE
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = true
         AND ("statsFeatures"->>'trackAssists')::boolean   = true
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'FULL'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = true
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'SCORER_ONLY'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = false
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'GOALS_ONLY'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = false
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = false THEN 'SUBSTITUTION_ONLY'
        ELSE 'FULL'
      END
    `;

    const nullableCase = `
      CASE
        WHEN "statsFeatures" IS NULL THEN NULL
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = true
         AND ("statsFeatures"->>'trackAssists')::boolean   = true
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'FULL'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = true
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'SCORER_ONLY'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = false
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = true  THEN 'GOALS_ONLY'
        WHEN ("statsFeatures"->>'trackGoals')::boolean     = true
         AND ("statsFeatures"->>'trackScorer')::boolean    = false
         AND ("statsFeatures"->>'trackAssists')::boolean   = false
         AND ("statsFeatures"->>'trackSubstitutions')::boolean = true
         AND ("statsFeatures"->>'trackPositions')::boolean = false THEN 'SUBSTITUTION_ONLY'
        ELSE 'FULL'
      END
    `;

    // ── team_configurations ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE team_configurations
        ADD COLUMN "statsTrackingLevel" character varying(20) NOT NULL DEFAULT 'FULL'
    `);

    await queryRunner.query(
      `UPDATE team_configurations SET "statsTrackingLevel" = ${teamConfigCase}`,
    );

    await queryRunner.query(
      `ALTER TABLE team_configurations DROP COLUMN "statsFeatures"`,
    );

    // ── games ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE games ADD COLUMN "statsTrackingLevel" character varying(20) DEFAULT NULL
    `);

    await queryRunner.query(
      `UPDATE games SET "statsTrackingLevel" = ${nullableCase}`,
    );

    await queryRunner.query(`ALTER TABLE games DROP COLUMN "statsFeatures"`);

    // ── game_teams ────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE game_teams ADD COLUMN "statsTrackingLevel" character varying(20) DEFAULT NULL
    `);

    await queryRunner.query(
      `UPDATE game_teams SET "statsTrackingLevel" = ${nullableCase}`,
    );

    await queryRunner.query(
      `ALTER TABLE game_teams DROP COLUMN "statsFeatures"`,
    );
  }
}
