import { MigrationInterface, QueryRunner } from 'typeorm';

export class Add4v4GameFormat1769210000000 implements MigrationInterface {
  name = 'Add4v4GameFormat1769210000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 4v4 format with 4 x 10-minute periods (quarters)
    await queryRunner.query(`
      INSERT INTO "game_formats" (
        "name",
        "description",
        "playersPerTeam",
        "durationMinutes",
        "numberOfPeriods",
        "periodDurationMinutes",
        "allowsSubstitutions",
        "maxSubstitutions"
      )
      VALUES (
        '4v4',
        '4v4 format with four 10-minute quarters (no goalkeeper, typical formations: 1-2-1, 2-2)',
        4,
        40,
        4,
        10,
        true,
        NULL
      )
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "game_formats" WHERE "name" = '4v4'
    `);
  }
}
