import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds tactical event types: POSITION_SWAP and FORMATION_CHANGE.
 *
 * These event types support tactical tracking during games:
 *   - POSITION_SWAP: Two players swap positions on the field
 *   - FORMATION_CHANGE: Team formation changed during the game
 *
 * This migration is idempotent - it will not create duplicates if the event types
 * already exist (e.g., from app startup seeding).
 */
export class AddTacticalEventTypes1768720556985 implements MigrationInterface {
  name = 'AddTacticalEventTypes1768720556985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tacticalEventTypes = [
      {
        name: 'POSITION_SWAP',
        category: 'TACTICAL',
        description: 'Two players swap positions on the field',
        requiresPosition: true,
        allowsParent: true,
      },
      {
        name: 'FORMATION_CHANGE',
        category: 'TACTICAL',
        description: 'Team formation changed during the game',
        requiresPosition: false,
        allowsParent: false,
      },
    ];

    for (const eventType of tacticalEventTypes) {
      // Use INSERT ... WHERE NOT EXISTS since there's no unique constraint on name
      await queryRunner.query(
        `INSERT INTO event_types (id, name, category, description, "requiresPosition", "allowsParent", "createdAt", "updatedAt")
         SELECT uuid_generate_v4(), $1::varchar, $2, $3, $4, $5, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM event_types WHERE name = $1::varchar)`,
        [
          eventType.name,
          eventType.category,
          eventType.description,
          eventType.requiresPosition,
          eventType.allowsParent,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First delete any game_events that reference these event types
    await queryRunner.query(
      `DELETE FROM game_events WHERE "eventTypeId" IN (
         SELECT id FROM event_types WHERE name IN ('POSITION_SWAP', 'FORMATION_CHANGE')
       )`,
    );

    // Then delete the event types themselves
    await queryRunner.query(
      `DELETE FROM event_types WHERE name IN ('POSITION_SWAP', 'FORMATION_CHANGE')`,
    );
  }
}
