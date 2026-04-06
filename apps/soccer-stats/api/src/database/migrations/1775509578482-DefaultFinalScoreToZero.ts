import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultFinalScoreToZero1775509578482
  implements MigrationInterface
{
  name = 'DefaultFinalScoreToZero1775509578482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_member_roles" DROP CONSTRAINT "FK_team_member_roles_teamMember"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_game_events_timing"`);
    await queryRunner.query(
      `UPDATE "game_teams" SET "finalScore" = 0 WHERE "finalScore" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "finalScore" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "finalScore" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "periodSecond" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_member_roles" ADD CONSTRAINT "FK_2b66fa10fc39d2c72503490a054" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_member_roles" DROP CONSTRAINT "FK_2b66fa10fc39d2c72503490a054"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "periodSecond" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "finalScore" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "finalScore" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_game_events_timing" ON "game_events" ("createdAt", "period", "periodSecond") `,
    );
    await queryRunner.query(
      `ALTER TABLE "team_member_roles" ADD CONSTRAINT "FK_team_member_roles_teamMember" FOREIGN KEY ("teamMemberId") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
