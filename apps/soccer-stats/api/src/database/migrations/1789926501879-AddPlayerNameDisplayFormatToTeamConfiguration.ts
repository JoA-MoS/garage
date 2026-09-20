import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerNameDisplayFormatToTeamConfiguration1789926501879
  implements MigrationInterface
{
  name = 'AddPlayerNameDisplayFormatToTeamConfiguration1789926501879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."team_configurations_playernamedisplayformat_enum" AS ENUM('FIRST_NAME', 'LAST_NAME', 'FIRST_LAST', 'LAST_COMMA_FIRST', 'FIRST_LASTINITIAL', 'FIRSTINITIAL_LASTINITIAL', 'FIRSTINITIAL_LAST')`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ADD "playerNameDisplayFormat" "public"."team_configurations_playernamedisplayformat_enum" NOT NULL DEFAULT 'FIRST_LAST'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ADD "showJerseyNumber" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."team_configurations_jerseynumberposition_enum" AS ENUM('BEFORE', 'AFTER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ADD "jerseyNumberPosition" "public"."team_configurations_jerseynumberposition_enum" NOT NULL DEFAULT 'BEFORE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_configurations" DROP COLUMN "jerseyNumberPosition"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."team_configurations_jerseynumberposition_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" DROP COLUMN "showJerseyNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" DROP COLUMN "playerNameDisplayFormat"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."team_configurations_playernamedisplayformat_enum"`,
    );
  }
}
