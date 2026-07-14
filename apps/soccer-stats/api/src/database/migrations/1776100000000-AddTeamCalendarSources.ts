import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeamCalendarSources1776100000000 implements MigrationInterface {
  name = 'AddTeamCalendarSources1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "team_calendar_sources" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "teamId" uuid NOT NULL,
        "provider" character varying(50) NOT NULL,
        "feedUrl" text NOT NULL,
        "calendarName" character varying(255),
        "enabled" boolean NOT NULL DEFAULT true,
        "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
        "lastSyncStatus" character varying(30) NOT NULL DEFAULT 'never_synced',
        "lastSyncError" text,
        CONSTRAINT "PK_team_calendar_sources" PRIMARY KEY ("id"),
        CONSTRAINT "FK_team_calendar_sources_team" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_team_calendar_sources_teamId" ON "team_calendar_sources" ("teamId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "external_game_mappings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "calendarSourceId" uuid NOT NULL,
        "gameId" uuid NOT NULL,
        "externalUid" character varying(255) NOT NULL,
        "externalSequence" integer,
        "externalCreatedAt" TIMESTAMP WITH TIME ZONE,
        "externalLastModified" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_external_game_mappings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_external_game_mappings_source_uid" UNIQUE ("calendarSourceId", "externalUid"),
        CONSTRAINT "FK_external_game_mappings_source" FOREIGN KEY ("calendarSourceId") REFERENCES "team_calendar_sources"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_external_game_mappings_game" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_external_game_mappings_gameId" ON "external_game_mappings" ("gameId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_external_game_mappings_gameId"`);
    await queryRunner.query(`DROP TABLE "external_game_mappings"`);
    await queryRunner.query(`DROP INDEX "IDX_team_calendar_sources_teamId"`);
    await queryRunner.query(`DROP TABLE "team_calendar_sources"`);
  }
}
