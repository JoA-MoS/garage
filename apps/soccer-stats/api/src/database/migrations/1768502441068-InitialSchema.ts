import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1768502441068 implements MigrationInterface {
  name = 'InitialSchema1768502441068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."event_types_category_enum" AS ENUM('SCORING', 'DISCIPLINARY', 'SUBSTITUTION', 'TACTICAL', 'GAME_FLOW')`,
    );
    await queryRunner.query(
      `CREATE TABLE "event_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "category" "public"."event_types_category_enum" NOT NULL, "description" text, "requiresPosition" boolean NOT NULL DEFAULT false, "allowsParent" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ffe6b2d60596409fb08fb13830d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gameId" uuid NOT NULL, "eventTypeId" uuid NOT NULL, "playerId" uuid, "externalPlayerName" character varying(100), "externalPlayerNumber" character varying(10), "recordedByUserId" uuid NOT NULL, "gameTeamId" uuid NOT NULL, "parentEventId" uuid, "gameMinute" integer NOT NULL, "gameSecond" integer NOT NULL, "position" character varying(50), "formation" character varying(20), "description" text, "conflictId" uuid, "metadata" json, CONSTRAINT "PK_250946158c7913ba536add1e602" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_configurations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid NOT NULL, "defaultGameFormatId" uuid, "defaultFormation" character varying(50) NOT NULL DEFAULT '4-4-2', "defaultGameDuration" integer NOT NULL DEFAULT '90', "defaultPlayerCount" integer NOT NULL DEFAULT '11', "statsTrackingLevel" character varying(20) NOT NULL DEFAULT 'FULL', CONSTRAINT "REL_4b62559d65b4fef3172f5eaeaf" UNIQUE ("teamId"), CONSTRAINT "PK_e65a3c536adabf8d55d0d624925" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_formats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(50) NOT NULL, "description" text, "playersPerTeam" integer NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '90', "allowsSubstitutions" boolean NOT NULL DEFAULT true, "maxSubstitutions" integer, CONSTRAINT "UQ_bba1e763112c65e6b157bf21d6f" UNIQUE ("name"), CONSTRAINT "PK_835f3dea05f66360c9175cf5db1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gameFormatId" uuid NOT NULL, "name" character varying(255), "scheduledStart" TIMESTAMP, "venue" character varying(255), "weatherConditions" character varying(255), "notes" text, "status" character varying(20) NOT NULL DEFAULT 'SCHEDULED', "actualStart" TIMESTAMP, "firstHalfEnd" TIMESTAMP, "secondHalfStart" TIMESTAMP, "actualEnd" TIMESTAMP, "pausedAt" TIMESTAMP, "statsTrackingLevel" character varying(20), "statsFeatureOverrides" json, CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "gameId" uuid NOT NULL, "teamId" uuid NOT NULL, "teamType" character varying(10) NOT NULL, "formation" character varying(50), "finalScore" integer, "tacticalNotes" text, "statsTrackingLevel" character varying(20), CONSTRAINT "PK_e65b2d153b104c1d89cbba08057" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_coaches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid NOT NULL, "userId" uuid NOT NULL, "role" character varying(100) NOT NULL DEFAULT 'Head Coach', "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_6b0375a0dbfefdc8ea4087be174" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."team_members_role_enum" AS ENUM('OWNER', 'MANAGER', 'COACH', 'PLAYER', 'PARENT_FAN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."team_members_role_enum" NOT NULL, "linkedPlayerId" uuid, "isGuest" boolean NOT NULL DEFAULT false, "invitedById" uuid, "invitedAt" TIMESTAMP, "acceptedAt" TIMESTAMP, CONSTRAINT "PK_ca3eae89dcf20c9fd95bf7460aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_team_member_unique" ON "team_members" ("teamId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teams_sourcetype_enum" AS ENUM('internal', 'external')`,
    );
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "shortName" character varying(50), "description" text, "homePrimaryColor" character varying(50), "homeSecondaryColor" character varying(50), "awayPrimaryColor" character varying(50), "awaySecondaryColor" character varying(50), "logoUrl" character varying(255), "isManaged" boolean NOT NULL DEFAULT true, "sourceType" "public"."teams_sourcetype_enum" NOT NULL DEFAULT 'internal', "externalReference" character varying(255), "isActive" boolean NOT NULL DEFAULT true, "createdById" character varying(255), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "team_players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "teamId" uuid NOT NULL, "userId" uuid NOT NULL, "jerseyNumber" character varying(10), "primaryPosition" character varying(50), "joinedDate" TIMESTAMP, "leftDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e5cc65b0865477e94f8c08af216" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_lastnamevisibility_enum" AS ENUM('PUBLIC', 'TEAM_ONLY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "clerkId" character varying(255), "email" character varying(255), "passwordHash" character varying(255), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "phone" character varying(20), "dateOfBirth" date, "isActive" boolean NOT NULL DEFAULT true, "lastNameVisibility" "public"."users_lastnamevisibility_enum" NOT NULL DEFAULT 'TEAM_ONLY', CONSTRAINT "UQ_b0e4d1eb939d0387788678c4f8e" UNIQUE ("clerkId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_c641a4f03aef07c2cd0601baf33" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_10aae234c18c0fbb1db062b7691" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_792b1e430af1e5e00c653099c84" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_ce7d8b3a225a90f8be0a44de7c4" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_158f89788a70d9edbe51d7c3b70" FOREIGN KEY ("gameTeamId") REFERENCES "game_teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD CONSTRAINT "FK_f9595c9bd9d1c9be10c6eac9072" FOREIGN KEY ("parentEventId") REFERENCES "game_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ADD CONSTRAINT "FK_4b62559d65b4fef3172f5eaeafe" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ADD CONSTRAINT "FK_f84d53006e1d673167a57b5e021" FOREIGN KEY ("defaultGameFormatId") REFERENCES "game_formats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_d7dabe705b6b096a33e96d261ff" FOREIGN KEY ("gameFormatId") REFERENCES "game_formats"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ADD CONSTRAINT "FK_64634e4f6374a7d87e5093f7099" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ADD CONSTRAINT "FK_c4352b2683b6ae97be92f6e66a5" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ADD CONSTRAINT "FK_a266acee8fece1d368260be2e97" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ADD CONSTRAINT "FK_6eeb92e877374bdfed0bb9710a3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_4b724aaec9a13c7567e73dca81c" FOREIGN KEY ("linkedPlayerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_643a624101d58d25325ae3cd8d9" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ADD CONSTRAINT "FK_effe320794b867b0a862cafd58c" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ADD CONSTRAINT "FK_657b59335563a85dfa3f30a8598" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "team_players" DROP CONSTRAINT "FK_657b59335563a85dfa3f30a8598"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" DROP CONSTRAINT "FK_effe320794b867b0a862cafd58c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_643a624101d58d25325ae3cd8d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_4b724aaec9a13c7567e73dca81c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_0a72b849753a046462b4c5a8ec2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" DROP CONSTRAINT "FK_6d1c8c7f705803f0711336a5c33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" DROP CONSTRAINT "FK_6eeb92e877374bdfed0bb9710a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" DROP CONSTRAINT "FK_a266acee8fece1d368260be2e97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" DROP CONSTRAINT "FK_c4352b2683b6ae97be92f6e66a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" DROP CONSTRAINT "FK_64634e4f6374a7d87e5093f7099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" DROP CONSTRAINT "FK_d7dabe705b6b096a33e96d261ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" DROP CONSTRAINT "FK_f84d53006e1d673167a57b5e021"`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" DROP CONSTRAINT "FK_4b62559d65b4fef3172f5eaeafe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_f9595c9bd9d1c9be10c6eac9072"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_158f89788a70d9edbe51d7c3b70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_ce7d8b3a225a90f8be0a44de7c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_792b1e430af1e5e00c653099c84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_10aae234c18c0fbb1db062b7691"`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP CONSTRAINT "FK_c641a4f03aef07c2cd0601baf33"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP TYPE "public"."users_lastnamevisibility_enum"`,
    );
    await queryRunner.query(`DROP TABLE "team_players"`);
    await queryRunner.query(`DROP TABLE "teams"`);
    await queryRunner.query(`DROP TYPE "public"."teams_sourcetype_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_team_member_unique"`);
    await queryRunner.query(`DROP TABLE "team_members"`);
    await queryRunner.query(`DROP TYPE "public"."team_members_role_enum"`);
    await queryRunner.query(`DROP TABLE "team_coaches"`);
    await queryRunner.query(`DROP TABLE "game_teams"`);
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(`DROP TABLE "game_formats"`);
    await queryRunner.query(`DROP TABLE "team_configurations"`);
    await queryRunner.query(`DROP TABLE "game_events"`);
    await queryRunner.query(`DROP TABLE "event_types"`);
    await queryRunner.query(`DROP TYPE "public"."event_types_category_enum"`);
  }
}
