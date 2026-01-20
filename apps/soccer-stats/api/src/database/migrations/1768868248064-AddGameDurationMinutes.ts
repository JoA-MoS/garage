import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds durationMinutes column to games table to allow overriding
 * the game format's default duration on a per-game basis.
 *
 * When durationMinutes is NULL, the game uses the format's default duration.
 */
export class AddGameDurationMinutes1768868248064 implements MigrationInterface {
  name = 'AddGameDurationMinutes1768868248064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" ADD "durationMinutes" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" DROP COLUMN "durationMinutes"`,
    );
  }
}
