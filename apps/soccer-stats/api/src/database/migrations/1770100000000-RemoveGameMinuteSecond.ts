import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGameMinuteSecond1770100000000 implements MigrationInterface {
  name = 'RemoveGameMinuteSecond1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP COLUMN "gameMinute"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP COLUMN "gameSecond"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD "gameSecond" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD "gameMinute" integer NOT NULL DEFAULT 0`,
    );
  }
}
