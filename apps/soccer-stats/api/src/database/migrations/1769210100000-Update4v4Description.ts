import { MigrationInterface, QueryRunner } from 'typeorm';

export class Update4v4Description1769210100000 implements MigrationInterface {
  name = 'Update4v4Description1769210100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update 4v4 description to note no goalkeeper and typical formations
    await queryRunner.query(`
      UPDATE "game_formats"
      SET "description" = '4v4 format with four 10-minute quarters (no goalkeeper, typical formations: 1-2-1, 2-2)'
      WHERE "name" = '4v4'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "game_formats"
      SET "description" = '4v4 format with four 10-minute quarters'
      WHERE "name" = '4v4'
    `);
  }
}
