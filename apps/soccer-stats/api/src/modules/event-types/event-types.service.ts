import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EventType, EventCategory } from '../../entities/event-type.entity';

interface CreateEventTypeInput {
  name: string;
  category: EventCategory;
  description?: string;
  requiresPosition?: boolean;
  allowsParent?: boolean;
}

@Injectable()
export class EventTypesService {
  private readonly logger = new Logger(EventTypesService.name);

  constructor(
    @InjectRepository(EventType)
    private eventTypesRepository: Repository<EventType>,
  ) {}

  async findAll(): Promise<EventType[]> {
    return this.eventTypesRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<EventType | null> {
    return this.eventTypesRepository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<EventType | null> {
    return this.eventTypesRepository.findOne({
      where: { name },
    });
  }

  async findByCategory(category: EventCategory): Promise<EventType[]> {
    return this.eventTypesRepository.find({
      where: { category },
      order: { name: 'ASC' },
    });
  }

  async create(input: CreateEventTypeInput): Promise<EventType> {
    const eventType = this.eventTypesRepository.create(input);
    return this.eventTypesRepository.save(eventType);
  }

  /**
   * @deprecated Use SeedReferenceData migration instead. This method is kept
   * for backwards compatibility but seeding is now done via TypeORM migrations.
   */
  async seedDefaultEventTypes(): Promise<void> {
    const existingTypes = await this.eventTypesRepository.count();

    if (existingTypes > 0) {
      this.logger.debug('Event types already exist, skipping seed');
      return;
    }

    const defaultEventTypes: CreateEventTypeInput[] = [
      // Roster events (TACTICAL category)
      {
        name: 'GAME_ROSTER',
        category: EventCategory.TACTICAL,
        description: 'Player added to game day roster',
        requiresPosition: false,
        allowsParent: false,
      },
      // Substitution events
      {
        name: 'SUBSTITUTION_IN',
        category: EventCategory.SUBSTITUTION,
        description: 'Player entering the field',
        requiresPosition: true,
        allowsParent: true,
      },
      {
        name: 'SUBSTITUTION_OUT',
        category: EventCategory.SUBSTITUTION,
        description: 'Player leaving the field',
        requiresPosition: false,
        allowsParent: false,
      },
      // Tactical events
      {
        name: 'POSITION_SWAP',
        category: EventCategory.TACTICAL,
        description: 'Two players swap positions on the field',
        requiresPosition: true,
        allowsParent: true,
      },
      {
        name: 'FORMATION_CHANGE',
        category: EventCategory.TACTICAL,
        description: 'Team formation changed during the game',
        requiresPosition: false,
        allowsParent: false,
      },
      // Scoring events
      {
        name: 'GOAL',
        category: EventCategory.SCORING,
        description: 'Goal scored',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'ASSIST',
        category: EventCategory.SCORING,
        description: 'Assist on a goal',
        requiresPosition: false,
        allowsParent: true,
      },
      {
        name: 'OWN_GOAL',
        category: EventCategory.SCORING,
        description: 'Own goal scored',
        requiresPosition: false,
        allowsParent: false,
      },
      // Disciplinary events
      {
        name: 'YELLOW_CARD',
        category: EventCategory.DISCIPLINARY,
        description: 'Yellow card issued',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'RED_CARD',
        category: EventCategory.DISCIPLINARY,
        description: 'Red card issued',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'SECOND_YELLOW',
        category: EventCategory.DISCIPLINARY,
        description: 'Second yellow card (red)',
        requiresPosition: false,
        allowsParent: true,
      },
      // Game flow events - timing
      {
        name: 'GAME_START',
        category: EventCategory.GAME_FLOW,
        description: 'Game officially begins',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'GAME_END',
        category: EventCategory.GAME_FLOW,
        description: 'Game officially ends',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'PERIOD_START',
        category: EventCategory.GAME_FLOW,
        description:
          'Period begins (metadata.period indicates which: "1", "2", "OT1", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'PERIOD_END',
        category: EventCategory.GAME_FLOW,
        description:
          'Period ends (metadata.period indicates which: "1", "2", "OT1", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'STOPPAGE_START',
        category: EventCategory.GAME_FLOW,
        description:
          'Clock paused (metadata.reason optional: "injury", "weather", etc.)',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'STOPPAGE_END',
        category: EventCategory.GAME_FLOW,
        description: 'Clock resumes after stoppage',
        requiresPosition: false,
        allowsParent: false,
      },
    ];

    for (const eventType of defaultEventTypes) {
      await this.create(eventType);
    }

    this.logger.log('Successfully seeded default event types');
  }
}
