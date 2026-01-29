import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGameSecondsAndPeriodColumns1769400000000
  implements MigrationInterface
{
  name = 'AddGameSecondsAndPeriodColumns1769400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add period column as varchar for flexibility (handles "1", "2", "OT1", "OT2", etc.)
    await queryRunner.query(`
      ALTER TABLE "game_events"
      ADD COLUMN IF NOT EXISTS "period" varchar(10)
    `);

    // Add periodSecond column - seconds elapsed within the current period (resets each period)
    // This matches how soccer actually works: clock resets at halftime
    await queryRunner.query(`
      ALTER TABLE "game_events"
      ADD COLUMN IF NOT EXISTS "periodSecond" integer
    `);

    // Migrate period from metadata where applicable
    await queryRunner.query(`
      UPDATE "game_events"
      SET "period" = metadata->>'period'
      WHERE metadata->>'period' IS NOT NULL
        AND "period" IS NULL
    `);

    // Migrate existing timing data to period-relative format
    // For existing events without period info, infer period from gameMinute:
    // - Events in first half (minute 0-44): period "1", periodSecond = gameMinute*60 + gameSecond
    // - Events in second half (minute 45+): period "2", periodSecond relative to period start
    // This assumes standard 45-minute halves for migration purposes
    await queryRunner.query(`
      UPDATE "game_events"
      SET
        "period" = CASE
          WHEN "period" IS NOT NULL THEN "period"
          WHEN "gameMinute" < 45 THEN '1'
          ELSE '2'
        END,
        "periodSecond" = CASE
          WHEN "gameMinute" < 45 THEN ("gameMinute" * 60) + "gameSecond"
          ELSE (("gameMinute" - 45) * 60) + "gameSecond"
        END
      WHERE "periodSecond" IS NULL
    `);

    // Make periodSecond NOT NULL now that data is migrated (default 0 for any edge cases)
    await queryRunner.query(`
      UPDATE "game_events" SET "periodSecond" = 0 WHERE "periodSecond" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "game_events"
      ALTER COLUMN "periodSecond" SET NOT NULL
    `);

    // Default period to "1" for any remaining nulls
    await queryRunner.query(`
      UPDATE "game_events" SET "period" = '1' WHERE "period" IS NULL
    `);

    // Add index for efficient sorting by period and time within period
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_game_events_timing"
      ON "game_events" ("period", "periodSecond", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the timing index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_game_events_timing"
    `);

    // Remove the new columns
    await queryRunner.query(`
      ALTER TABLE "game_events" DROP COLUMN IF EXISTS "periodSecond"
    `);
    await queryRunner.query(`
      ALTER TABLE "game_events" DROP COLUMN IF EXISTS "period"
    `);
  }
}
