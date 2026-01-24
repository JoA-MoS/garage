import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPeriodConfigToGameFormat1769200000000
  implements MigrationInterface
{
  name = 'AddPeriodConfigToGameFormat1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add numberOfPeriods column with default of 2 (standard halves)
    // Use IF NOT EXISTS for idempotency (column may exist from entity sync during development)
    await queryRunner.query(`
      ALTER TABLE "game_formats"
      ADD COLUMN IF NOT EXISTS "numberOfPeriods" integer NOT NULL DEFAULT 2
    `);

    // Add periodDurationMinutes column with default of 45 (standard half)
    await queryRunner.query(`
      ALTER TABLE "game_formats"
      ADD COLUMN IF NOT EXISTS "periodDurationMinutes" integer NOT NULL DEFAULT 45
    `);

    // Update existing formats to have correct periodDurationMinutes based on durationMinutes
    // For example: 60 min game = 2 x 30 min halves, 90 min game = 2 x 45 min halves
    await queryRunner.query(`
      UPDATE "game_formats"
      SET "periodDurationMinutes" = "durationMinutes" / 2
      WHERE "numberOfPeriods" = 2
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_formats" DROP COLUMN "periodDurationMinutes"
    `);
    await queryRunner.query(`
      ALTER TABLE "game_formats" DROP COLUMN "numberOfPeriods"
    `);
  }
}
