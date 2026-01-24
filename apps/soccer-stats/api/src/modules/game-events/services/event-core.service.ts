import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PubSub } from 'graphql-subscriptions';

import { GameEvent } from '../../../entities/game-event.entity';
import { EventType } from '../../../entities/event-type.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import { Game } from '../../../entities/game.entity';
import { Team } from '../../../entities/team.entity';
import {
  ConflictInfo,
  ConflictingEvent,
  GameEventAction,
  GameEventSubscriptionPayload,
} from '../dto/game-event-subscription.output';

// Detection result for duplicate/conflict checking
export interface DuplicateConflictResult {
  isDuplicate: boolean;
  isConflict: boolean;
  existingEvent?: GameEvent;
  conflictingEvents?: GameEvent[];
}

// Detection window in seconds
const DUPLICATE_CONFLICT_WINDOW_SECONDS = 60;

/**
 * Core service providing shared utilities for all game event services.
 * Handles event type caching, validation, and PubSub publishing.
 */
@Injectable()
export class EventCoreService implements OnModuleInit {
  private readonly logger = new Logger(EventCoreService.name);

  // Cache for event types - loaded once at startup since they're static reference data
  private eventTypeCache = new Map<string, EventType>();

  constructor(
    @InjectRepository(GameEvent)
    readonly gameEventsRepository: Repository<GameEvent>,
    @InjectRepository(EventType)
    private readonly eventTypesRepository: Repository<EventType>,
    @InjectRepository(GameTeam)
    readonly gameTeamsRepository: Repository<GameTeam>,
    @InjectRepository(Game)
    readonly gamesRepository: Repository<Game>,
    @InjectRepository(Team)
    readonly teamsRepository: Repository<Team>,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  /**
   * Load all event types into cache at service startup.
   * Event types are static reference data that rarely changes.
   */
  async onModuleInit(): Promise<void> {
    try {
      const eventTypes = await this.eventTypesRepository.find();

      if (eventTypes.length === 0) {
        this.logger.warn(
          'No event types found in database - cache is empty. Game events will fail.',
        );
        return;
      }

      eventTypes.forEach((et) => this.eventTypeCache.set(et.name, et));
      this.logger.log(`Cached ${eventTypes.length} event types`);
    } catch (error) {
      this.logger.error(
        'Failed to load event types into cache. Game events will fail.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Validates that at least one player reference is provided.
   * Used for events that require player info (lineup, substitutions, etc.)
   */
  ensurePlayerInfoProvided(
    playerId?: string,
    externalPlayerName?: string,
    context = 'event',
  ): void {
    if (!playerId && !externalPlayerName) {
      throw new BadRequestException(
        `Either playerId or externalPlayerName must be provided for this ${context}`,
      );
    }
  }

  /**
   * Get event type from cache by name.
   * Throws NotFoundException if not found (should never happen with valid event type names).
   */
  getEventTypeByName(name: string): EventType {
    const eventType = this.eventTypeCache.get(name);
    if (!eventType) {
      throw new NotFoundException(
        `Event type '${name}' not found. Cache has ${this.eventTypeCache.size} types: [${Array.from(this.eventTypeCache.keys()).join(', ')}]`,
      );
    }
    return eventType;
  }

  /**
   * Get GameTeam by ID, throwing NotFoundException if not found.
   */
  async getGameTeam(gameTeamId: string): Promise<GameTeam> {
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });
    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }
    return gameTeam;
  }

  /**
   * Publish a game event change to all subscribers
   */
  async publishGameEvent(
    gameId: string,
    action: GameEventAction,
    event?: GameEvent,
    deletedEventId?: string,
    conflict?: ConflictInfo,
  ): Promise<void> {
    const payload: GameEventSubscriptionPayload = {
      action,
      gameId,
      event,
      deletedEventId,
      conflict,
    };

    await this.pubSub.publish(`gameEvent:${gameId}`, {
      gameEventChanged: payload,
    });
  }

  /**
   * Check for duplicate or conflicting events within a time window.
   * - Duplicate: Same event type + same player within 60 seconds
   * - Conflict: Same event type + different player within 60 seconds
   */
  async checkForDuplicateOrConflict(
    gameTeamId: string,
    eventTypeName: string,
    playerId: string | undefined,
    externalPlayerName: string | undefined,
    gameMinute: number,
    gameSecond: number,
  ): Promise<DuplicateConflictResult> {
    const eventType = this.getEventTypeByName(eventTypeName);
    const targetTimeInSeconds = gameMinute * 60 + gameSecond;

    // Find events of the same type within the time window
    const events = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: eventType.id,
      },
      relations: ['eventType', 'player', 'recordedByUser'],
      order: { gameMinute: 'ASC', gameSecond: 'ASC' },
    });

    const eventsInWindow: GameEvent[] = [];

    for (const event of events) {
      const eventTimeInSeconds = event.gameMinute * 60 + event.gameSecond;
      const timeDiff = Math.abs(eventTimeInSeconds - targetTimeInSeconds);

      if (timeDiff <= DUPLICATE_CONFLICT_WINDOW_SECONDS) {
        eventsInWindow.push(event);
      }
    }

    if (eventsInWindow.length === 0) {
      return { isDuplicate: false, isConflict: false };
    }

    // Check if any event in the window has the same player
    const isSamePlayer = (event: GameEvent): boolean => {
      if (playerId && event.playerId) {
        return playerId === event.playerId;
      }
      if (externalPlayerName && event.externalPlayerName) {
        return (
          externalPlayerName.toLowerCase() ===
          event.externalPlayerName.toLowerCase()
        );
      }
      return false;
    };

    const duplicateEvent = eventsInWindow.find(isSamePlayer);
    if (duplicateEvent) {
      return {
        isDuplicate: true,
        isConflict: false,
        existingEvent: duplicateEvent,
      };
    }

    // No duplicate, but there are events in the window → conflict
    return {
      isDuplicate: false,
      isConflict: true,
      conflictingEvents: eventsInWindow,
    };
  }

  /**
   * Get player name for conflict info
   */
  getPlayerNameFromEvent(event: GameEvent): string {
    if (event.externalPlayerName) {
      return event.externalPlayerName;
    }
    if (event.player) {
      const fullName = `${event.player.firstName || ''} ${
        event.player.lastName || ''
      }`.trim();
      return fullName || event.player.email || 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * Get recorded by user name for conflict info
   */
  getRecordedByUserName(event: GameEvent): string {
    if (event.recordedByUser) {
      const fullName = `${event.recordedByUser.firstName || ''} ${
        event.recordedByUser.lastName || ''
      }`.trim();
      return fullName || event.recordedByUser.email || 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * Build conflict info for publishing
   */
  buildConflictInfo(
    conflictId: string,
    eventType: string,
    gameMinute: number,
    gameSecond: number,
    events: GameEvent[],
  ): ConflictInfo {
    const conflictingEventsInfo: ConflictingEvent[] = events.map((event) => ({
      eventId: event.id,
      playerName: this.getPlayerNameFromEvent(event),
      playerId: event.playerId,
      recordedByUserName: this.getRecordedByUserName(event),
    }));

    return {
      conflictId,
      eventType,
      gameMinute,
      gameSecond,
      conflictingEvents: conflictingEventsInfo,
    };
  }

  /**
   * Load a game event with standard relations for return values.
   */
  async loadEventWithRelations(eventId: string): Promise<GameEvent> {
    return this.gameEventsRepository.findOneOrFail({
      where: { id: eventId },
      relations: [
        'eventType',
        'player',
        'recordedByUser',
        'gameTeam',
        'game',
        'childEvents',
        'childEvents.eventType',
      ],
    });
  }
}
