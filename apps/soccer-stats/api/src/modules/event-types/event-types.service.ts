import { Injectable } from '@nestjs/common';
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
  constructor(
    @InjectRepository(EventType)
    private eventTypesRepository: Repository<EventType>
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

  async seedDefaultEventTypes(): Promise<void> {
    const existingTypes = await this.eventTypesRepository.count();

    if (existingTypes > 0) {
      console.log('Event types already exist, skipping seed');
      return;
    }

    const defaultEventTypes: CreateEventTypeInput[] = [
      // Lineup events (TACTICAL category)
      {
        name: 'STARTING_LINEUP',
        category: EventCategory.TACTICAL,
        description:
          'Player assigned to starting lineup with formation position',
        requiresPosition: true,
        allowsParent: false,
      },
      {
        name: 'BENCH',
        category: EventCategory.TACTICAL,
        description: 'Player assigned to bench roster for the game',
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
      // Game flow events
      {
        name: 'KICKOFF',
        category: EventCategory.GAME_FLOW,
        description: 'Game kickoff',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'HALFTIME',
        category: EventCategory.GAME_FLOW,
        description: 'Halftime whistle',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'FULL_TIME',
        category: EventCategory.GAME_FLOW,
        description: 'Full time whistle',
        requiresPosition: false,
        allowsParent: false,
      },
      {
        name: 'INJURY_STOPPAGE',
        category: EventCategory.GAME_FLOW,
        description: 'Play stopped for injury',
        requiresPosition: false,
        allowsParent: false,
      },
    ];

    for (const eventType of defaultEventTypes) {
      await this.create(eventType);
    }

    console.log('Successfully seeded default event types');
  }

  /**
   * Ensure a specific event type exists (useful for migrations/updates)
   */
  async ensureEventTypeExists(input: CreateEventTypeInput): Promise<EventType> {
    const existing = await this.findByName(input.name);
    if (existing) {
      return existing;
    }
    console.log(`Creating missing event type: ${input.name}`);
    return this.create(input);
  }

  /**
   * Ensure all new event types added after initial seed exist
   */
  async ensureNewEventTypesExist(): Promise<void> {
    // Add any new event types here that weren't in the original seed
    const newEventTypes: CreateEventTypeInput[] = [
      {
        name: 'POSITION_SWAP',
        category: EventCategory.TACTICAL,
        description: 'Two players swap positions on the field',
        requiresPosition: true,
        allowsParent: true,
      },
    ];

    for (const eventType of newEventTypes) {
      await this.ensureEventTypeExists(eventType);
    }
  }
}
