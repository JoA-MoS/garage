import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts all TIMESTAMP columns to TIMESTAMPTZ (timestamp with time zone).
 *
 * This fixes a timezone bug where timestamps written by servers in UTC
 * are misinterpreted by clients in different timezones. The symptom was
 * game clocks showing -480 minutes (8 hours off) when the deployed server
 * (UTC) and local development machine (PST) had different timezones.
 *
 * PostgreSQL's TIMESTAMPTZ stores timestamps in UTC internally and
 * automatically converts to/from the client's timezone on read/write,
 * ensuring consistent behavior across different server timezones.
 *
 * Uses ALTER COLUMN TYPE to preserve existing data, treating current
 * values as UTC (since they were written by the production server in UTC).
 */
export class ConvertToTimestamptz1769110989864 implements MigrationInterface {
  name = 'ConvertToTimestamptz1769110989864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // event_types table
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // game_events table
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // team_configurations table
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // game_formats table
    await queryRunner.query(
      `ALTER TABLE "game_formats" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_formats" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // games table (has additional timestamp columns beyond createdAt/updatedAt)
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "scheduledStart" TYPE TIMESTAMPTZ USING "scheduledStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "actualStart" TYPE TIMESTAMPTZ USING "actualStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "firstHalfEnd" TYPE TIMESTAMPTZ USING "firstHalfEnd" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "secondHalfStart" TYPE TIMESTAMPTZ USING "secondHalfStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "actualEnd" TYPE TIMESTAMPTZ USING "actualEnd" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "pausedAt" TYPE TIMESTAMPTZ USING "pausedAt" AT TIME ZONE 'UTC'`,
    );

    // game_teams table
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // team_coaches table
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "startDate" TYPE TIMESTAMPTZ USING "startDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "endDate" TYPE TIMESTAMPTZ USING "endDate" AT TIME ZONE 'UTC'`,
    );

    // team_members table
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "invitedAt" TYPE TIMESTAMPTZ USING "invitedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "acceptedAt" TYPE TIMESTAMPTZ USING "acceptedAt" AT TIME ZONE 'UTC'`,
    );

    // teams table
    await queryRunner.query(
      `ALTER TABLE "teams" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );

    // team_players table
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "joinedDate" TYPE TIMESTAMPTZ USING "joinedDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "leftDate" TYPE TIMESTAMPTZ USING "leftDate" AT TIME ZONE 'UTC'`,
    );

    // users table
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ USING "createdAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert users table
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert team_players table
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "leftDate" TYPE TIMESTAMP USING "leftDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "joinedDate" TYPE TIMESTAMP USING "joinedDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_players" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert teams table
    await queryRunner.query(
      `ALTER TABLE "teams" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert team_members table
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "acceptedAt" TYPE TIMESTAMP USING "acceptedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "invitedAt" TYPE TIMESTAMP USING "invitedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert team_coaches table
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "endDate" TYPE TIMESTAMP USING "endDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "startDate" TYPE TIMESTAMP USING "startDate" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_coaches" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert game_teams table
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_teams" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert games table
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "pausedAt" TYPE TIMESTAMP USING "pausedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "actualEnd" TYPE TIMESTAMP USING "actualEnd" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "secondHalfStart" TYPE TIMESTAMP USING "secondHalfStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "firstHalfEnd" TYPE TIMESTAMP USING "firstHalfEnd" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "actualStart" TYPE TIMESTAMP USING "actualStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "scheduledStart" TYPE TIMESTAMP USING "scheduledStart" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert game_formats table
    await queryRunner.query(
      `ALTER TABLE "game_formats" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_formats" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert team_configurations table
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_configurations" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert game_events table
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );

    // Revert event_types table
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "updatedAt" TYPE TIMESTAMP USING "updatedAt" AT TIME ZONE 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "createdAt" TYPE TIMESTAMP USING "createdAt" AT TIME ZONE 'UTC'`,
    );
  }
}
