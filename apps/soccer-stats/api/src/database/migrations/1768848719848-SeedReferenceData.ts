import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds all reference data (event types and game formats) for fresh databases.
 *
 * This migration is idempotent - it uses INSERT ... WHERE NOT EXISTS to avoid
 * duplicates. It can safely run on:
 *   - Fresh databases (seeds all data)
 *   - Existing databases with partial data (fills in missing records)
 *   - Databases with complete data (no-op)
 *
 * This replaces the startup seeding approach, moving reference data management
 * to migrations for better version control and deployment predictability.
 */
export class SeedReferenceData1768848719848 implements MigrationInterface {
  name = 'SeedReferenceData1768848719848';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed event types
    await this.seedEventTypes(queryRunner);

    // Seed game formats
    await this.seedGameFormats(queryRunner);
  }

  private async seedEventTypes(queryRunner: QueryRunner): Promise<void> {
    const eventTypes = [
      // Lineup events (TACTICAL category)
      {
        name: 'STARTING_LINEUP',
        category: 'TACTICAL',
        description:
          'Player assigned to starting lineup with formation position',
        requiresPosition: true,
        allowsParent: false,
      },
      {
        name: 'BENCH',
        category: 'TACTICAL',
        description: 'Player assigned to bench roster for the game',
        requiresPosition: false,
        allowsParent: false,
      },
      // Substitution events
      {
        name: 'SUBSTITUTION_IN',
        category: 'SUBSTITUTION',
        description: 'Player entering the field',
        requiresPosition: true,
        allowsParent: true,
      },
      {
        name: 'SUBSTITUTION_OUT',
        category: 'SUBSTITUTION',
        description: 'Player leaving the field',
        requiresPosition: false,
        allowsParent: false,
      },
      // Tactical events
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
      // Scoring events
      {
        name: 'GOAL',
        category: 'SCORING',
        description: 'Goal scored',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'ASSIST',
        category: 'SCORING',
        description: 'Assist on a goal',
        requiresPosition: false,
        allowsParent: true,
      },
      {
        name: 'OWN_GOAL',
        category: 'SCORING',
        description: 'Own goal scored',
        requiresPosition: false,
        allowsParent: false,
      },
      // Disciplinary events
      {
        name: 'YELLOW_CARD',
        category: 'DISCIPLINARY',
        description: 'Yellow card issued',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'RED_CARD',
        category: 'DISCIPLINARY',
        description: 'Red card issued',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'SECOND_YELLOW',
        category: 'DISCIPLINARY',
        description: 'Second yellow card (red)',
        requiresPosition: false,
        allowsParent: true,
      },
      // Game flow events - timing
      {
        name: 'GAME_START',
        category: 'GAME_FLOW',
        description: 'Game officially begins',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'GAME_END',
        category: 'GAME_FLOW',
        description: 'Game officially ends',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'PERIOD_START',
        category: 'GAME_FLOW',
        description:
          'Period begins (metadata.period indicates which: "1", "2", "OT1", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'PERIOD_END',
        category: 'GAME_FLOW',
        description:
          'Period ends (metadata.period indicates which: "1", "2", "OT1", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'STOPPAGE_START',
        category: 'GAME_FLOW',
        description:
          'Clock paused (metadata.reason optional: "injury", "weather", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'STOPPAGE_END',
        category: 'GAME_FLOW',
        description: 'Clock resumes after stoppage',
        requiresPosition: false,
        allowsParent: false,
      },
    ];

    for (const eventType of eventTypes) {
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

  private async seedGameFormats(queryRunner: QueryRunner): Promise<void> {
    const gameFormats = [
      {
        name: '11v11',
        playersPerTeam: 11,
        maxSubstitutions: 5,
        durationMinutes: 90,
        allowsSubstitutions: true,
        description:
          'Standard full-field football match with 11 players per side',
      },
      {
        name: '9v9',
        playersPerTeam: 9,
        maxSubstitutions: 5,
        durationMinutes: 60,
        allowsSubstitutions: true,
        description: 'Youth football format with 9 players per side (2x30 min)',
      },
      {
        name: '7v7',
        playersPerTeam: 7,
        maxSubstitutions: 5,
        durationMinutes: 50,
        allowsSubstitutions: true,
        description: 'Small-sided game with 7 players per side (2x25 min)',
      },
      {
        name: '5v5',
        playersPerTeam: 5,
        maxSubstitutions: 3,
        durationMinutes: 50,
        allowsSubstitutions: true,
        description: 'Futsal or small-sided game with 5 players per side',
      },
    ];

    for (const format of gameFormats) {
      // game_formats has a unique constraint on name, so we can use ON CONFLICT
      // But to be consistent with event_types, use the same pattern
      await queryRunner.query(
        `INSERT INTO game_formats (id, name, "playersPerTeam", "maxSubstitutions", "durationMinutes", "allowsSubstitutions", description, "createdAt", "updatedAt")
         SELECT uuid_generate_v4(), $1::varchar, $2, $3, $4, $5, $6, NOW(), NOW()
         WHERE NOT EXISTS (SELECT 1 FROM game_formats WHERE name = $1::varchar)`,
        [
          format.name,
          format.playersPerTeam,
          format.maxSubstitutions,
          format.durationMinutes,
          format.allowsSubstitutions,
          format.description,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded game formats (only if no games reference them)
    await queryRunner.query(
      `DELETE FROM game_formats
       WHERE name IN ('11v11', '9v9', '7v7', '5v5')
       AND NOT EXISTS (SELECT 1 FROM games WHERE "gameFormatId" = game_formats.id)`,
    );

    // Remove seeded event types (only if no game_events reference them)
    // Note: This is a partial revert - we only remove types that are unused
    const eventTypeNames = [
      'STARTING_LINEUP',
      'BENCH',
      'SUBSTITUTION_IN',
      'SUBSTITUTION_OUT',
      'POSITION_SWAP',
      'FORMATION_CHANGE',
      'GOAL',
      'ASSIST',
      'OWN_GOAL',
      'YELLOW_CARD',
      'RED_CARD',
      'SECOND_YELLOW',
      'GAME_START',
      'GAME_END',
      'PERIOD_START',
      'PERIOD_END',
      'STOPPAGE_START',
      'STOPPAGE_END',
    ];

    for (const name of eventTypeNames) {
      await queryRunner.query(
        `DELETE FROM event_types
         WHERE name = $1
         AND NOT EXISTS (SELECT 1 FROM game_events WHERE "eventTypeId" = event_types.id)`,
        [name],
      );
    }
  }
}
