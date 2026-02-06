import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds POSITION_CHANGE event type for tracking player position changes mid-game.
 *
 * Used when a formation change reassigns players to new positions.
 * This was previously only in the seed SQL but missing from migrations,
 * causing "Event type 'POSITION_CHANGE' not found" errors on existing databases.
 */
export class AddPositionChangeEventType1770000000000
  implements MigrationInterface
{
  name = 'AddPositionChangeEventType1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
       SELECT uuid_generate_v4(), 'POSITION_CHANGE', 'TACTICAL', 'Player position change during match', false, false, NOW(), NOW()
       WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = 'POSITION_CHANGE')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM game_events WHERE "eventTypeId" IN (
         SELECT id FROM event_types WHERE name = 'POSITION_CHANGE'
       )`,
    );
    await queryRunner.query(
      `DELETE FROM event_types WHERE name = 'POSITION_CHANGE'`,
    );
  }
}
