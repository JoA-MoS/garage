import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Updates game format durations for 9v9 and 7v7 to match actual youth soccer standards.
 *
 * Corrections:
 *   - 9v9: 70 → 60 minutes (2x30 minute halves)
 *   - 7v7: 60 → 50 minutes (2x25 minute halves)
 */
export class UpdateGameFormatDurations1768867746931
  implements MigrationInterface
{
  name = 'UpdateGameFormatDurations1768867746931';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update 9v9 duration: 70 → 60 minutes
    await queryRunner.query(
      `UPDATE game_formats SET "durationMinutes" = 60, "updatedAt" = NOW() WHERE name = '9v9'`,
    );

    // Update 7v7 duration: 60 → 50 minutes
    await queryRunner.query(
      `UPDATE game_formats SET "durationMinutes" = 50, "updatedAt" = NOW() WHERE name = '7v7'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original values
    await queryRunner.query(
      `UPDATE game_formats SET "durationMinutes" = 70, "updatedAt" = NOW() WHERE name = '9v9'`,
    );

    await queryRunner.query(
      `UPDATE game_formats SET "durationMinutes" = 60, "updatedAt" = NOW() WHERE name = '7v7'`,
    );
  }
}
