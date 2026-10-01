import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BaseEntity tables' createdAt defaulted to now(), which is fixed for a
 * whole transaction. Multi-row actions (e.g. a batch of subs and swaps) now
 * write in one transaction, so their events tied on createdAt - the final
 * tie-breaker when ordering events at the same period/second.
 * clock_timestamp() advances per statement, so createdAt follows write
 * order. Outside a transaction the two are equivalent.
 */
const TABLES = [
  'external_game_mappings',
  'games',
  'team_member_roles',
  'event_types',
  'users',
  'team_calendar_sources',
  'teams',
  'game_teams',
  'team_members',
  'team_configurations',
  'game_formats',
  'game_events',
];

export class CreatedAtClockTimestamp1790200000000
  implements MigrationInterface
{
  name = 'CreatedAtClockTimestamp1790200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "createdAt" SET DEFAULT clock_timestamp()`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "createdAt" SET DEFAULT now()`,
      );
    }
  }
}
