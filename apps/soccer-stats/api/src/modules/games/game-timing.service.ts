import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';

/**
 * Computed timing data derived from timing events.
 * Replaces the legacy timing columns on the Game entity.
 */
export interface GameTiming {
  /** When the game actually started (from GAME_START event) */
  actualStart?: Date;
  /** When the first half ended (from PERIOD_END with period="1") */
  firstHalfEnd?: Date;
  /** When the second half started (from PERIOD_START with period="2") */
  secondHalfStart?: Date;
  /** When the game ended (from GAME_END event) */
  actualEnd?: Date;
  /** When the game was paused (from most recent unmatched STOPPAGE_START) */
  pausedAt?: Date;
}

/** Timing event type names for type safety */
const TIMING_EVENT_NAMES = [
  'GAME_START',
  'GAME_END',
  'PERIOD_START',
  'PERIOD_END',
  'STOPPAGE_START',
  'STOPPAGE_END',
] as const;

type TimingEventName = (typeof TIMING_EVENT_NAMES)[number];

/**
 * Service to derive game timing from timing events.
 *
 * This replaces the legacy timing columns (actualStart, firstHalfEnd, etc.)
 * with event-based computation. The source of truth is now timing events:
 * - GAME_START, GAME_END
 * - PERIOD_START, PERIOD_END (with period column indicating which period)
 * - STOPPAGE_START, STOPPAGE_END
 */
@Injectable()
export class GameTimingService implements OnModuleInit {
  private readonly logger = new Logger(GameTimingService.name);

  /** Cached timing event type IDs for efficient queries */
  private timingEventTypeIds: string[] = [];

  /** Map of event type ID to name for quick lookup */
  private eventTypeIdToName = new Map<string, TimingEventName>();

  /** Flag to track if event types are cached */
  private eventTypesCached = false;

  constructor(
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
  ) {}

  /**
   * Initialize the service by caching timing event types.
   * Event types are static reference data that rarely changes.
   */
  async onModuleInit(): Promise<void> {
    await this.loadTimingEventTypes();
  }

  /**
   * Load and cache timing event types from the database.
   * Called on module init and can be called to refresh the cache.
   */
  private async loadTimingEventTypes(): Promise<void> {
    try {
      const timingEventTypes = await this.eventTypeRepository.find({
        where: TIMING_EVENT_NAMES.map((name) => ({ name })),
      });

      this.timingEventTypeIds = timingEventTypes.map((et) => et.id);
      this.eventTypeIdToName.clear();
      timingEventTypes.forEach((et) => {
        this.eventTypeIdToName.set(et.id, et.name as TimingEventName);
      });
      this.eventTypesCached = true;

      if (this.timingEventTypeIds.length === 0) {
        this.logger.warn(
          'No timing event types found in database. ' +
            'Timing features will not work until event types are seeded.',
        );
      } else if (this.timingEventTypeIds.length < TIMING_EVENT_NAMES.length) {
        const foundNames = [...this.eventTypeIdToName.values()];
        const missingNames = TIMING_EVENT_NAMES.filter(
          (name) => !foundNames.includes(name),
        );
        this.logger.warn(
          `Missing timing event types: ${missingNames.join(', ')}. ` +
            'Some timing features may not work correctly.',
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to load timing event types. Timing features will not work.',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Ensure event types are cached before querying.
   * This handles the case where the service is used before onModuleInit completes.
   */
  private async ensureEventTypesCached(): Promise<void> {
    if (!this.eventTypesCached) {
      await this.loadTimingEventTypes();
    }
  }

  /**
   * Get computed timing for a game from its timing events.
   */
  async getGameTiming(gameId: string): Promise<GameTiming> {
    const timingMap = await this.getGameTimingBatch([gameId]);
    return timingMap.get(gameId) ?? {};
  }

  /**
   * Batch load computed timing for multiple games.
   * This is the primary method used by DataLoaders to prevent N+1 queries.
   */
  async getGameTimingBatch(
    gameIds: string[],
  ): Promise<Map<string, GameTiming>> {
    if (gameIds.length === 0) {
      return new Map();
    }

    await this.ensureEventTypesCached();

    const result = new Map<string, GameTiming>();

    // Initialize all games with empty timing
    for (const gameId of gameIds) {
      result.set(gameId, {});
    }

    if (this.timingEventTypeIds.length === 0) {
      this.logger.warn(
        'Cannot compute game timing: no timing event types are cached. ' +
          'Returning empty timing for all games.',
      );
      return result;
    }

    try {
      // Get all timing events for all games in a single query
      const events = await this.gameEventRepository
        .createQueryBuilder('ge')
        .where('ge.gameId IN (:...gameIds)', { gameIds })
        .andWhere('ge.eventTypeId IN (:...eventTypeIds)', {
          eventTypeIds: this.timingEventTypeIds,
        })
        .orderBy('ge.gameId', 'ASC')
        .addOrderBy('ge.createdAt', 'ASC')
        .getMany();

      // Group events by game and process
      const eventsByGame = new Map<string, GameEvent[]>();
      for (const event of events) {
        const gameEvents = eventsByGame.get(event.gameId) || [];
        gameEvents.push(event);
        eventsByGame.set(event.gameId, gameEvents);
      }

      // Process events for each game
      for (const [gameId, gameEvents] of eventsByGame) {
        const timing = this.computeTimingFromEvents(gameEvents);
        result.set(gameId, timing);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to load timing events for games: ${gameIds.join(', ')}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Compute timing from a list of events for a single game.
   * Events must be sorted by createdAt in ascending order.
   */
  private computeTimingFromEvents(events: GameEvent[]): GameTiming {
    const timing: GameTiming = {};

    // Track stoppage events to determine if currently paused
    let lastStoppageStart: Date | undefined;

    for (const event of events) {
      const eventTypeName = this.eventTypeIdToName.get(event.eventTypeId);
      const period = event.period;

      switch (eventTypeName) {
        case 'GAME_START':
          timing.actualStart = event.createdAt;
          break;

        case 'GAME_END':
          timing.actualEnd = event.createdAt;
          break;

        case 'PERIOD_END':
          if (period === '1') {
            timing.firstHalfEnd = event.createdAt;
          }
          break;

        case 'PERIOD_START':
          if (period === '2') {
            timing.secondHalfStart = event.createdAt;
          }
          break;

        case 'STOPPAGE_START':
          lastStoppageStart = event.createdAt;
          break;

        case 'STOPPAGE_END':
          // A STOPPAGE_END clears the paused state
          lastStoppageStart = undefined;
          break;
      }
    }

    // If there's an unmatched STOPPAGE_START, the game is paused
    if (lastStoppageStart && !timing.actualEnd) {
      timing.pausedAt = lastStoppageStart;
    }

    return timing;
  }

  /**
   * Get game duration in seconds, accounting for stoppages.
   * Used for position stats and time tracking.
   */
  async getGameDurationSeconds(
    gameId: string,
    durationMinutes = 60,
  ): Promise<number> {
    const timing = await this.getGameTiming(gameId);

    // If game hasn't started, return 0
    if (!timing.actualStart) {
      return 0;
    }

    // If game is completed, use actual end
    if (timing.actualEnd) {
      return Math.floor(
        (timing.actualEnd.getTime() - timing.actualStart.getTime()) / 1000,
      );
    }

    // Game is in progress
    const halfDuration = (durationMinutes / 2) * 60;

    if (timing.secondHalfStart) {
      // In second half
      const endTime = timing.pausedAt || new Date();
      const secondsIntoSecondHalf = Math.floor(
        (endTime.getTime() - timing.secondHalfStart.getTime()) / 1000,
      );
      return halfDuration + secondsIntoSecondHalf;
    } else if (timing.firstHalfEnd) {
      // At halftime - use first half duration
      return Math.floor(
        (timing.firstHalfEnd.getTime() - timing.actualStart.getTime()) / 1000,
      );
    } else {
      // In first half
      const endTime = timing.pausedAt || new Date();
      return Math.floor(
        (endTime.getTime() - timing.actualStart.getTime()) / 1000,
      );
    }
  }

  /**
   * Check if a game is currently paused.
   */
  async isGamePaused(gameId: string): Promise<boolean> {
    const timing = await this.getGameTiming(gameId);
    return timing.pausedAt !== undefined;
  }

  /**
   * Get timing info for each period (used by stats calculation).
   * Returns the duration of each completed period and current period info.
   */
  async getPeriodTimingInfo(
    gameId: string,
    durationMinutes = 60,
  ): Promise<{
    /** Duration of first half in seconds (0 if not started/completed) */
    period1DurationSeconds: number;
    /** Duration of second half in seconds (0 if not started/completed) */
    period2DurationSeconds: number;
    /** Current period ('1', '2', or undefined if game not started or at halftime) */
    currentPeriod?: string;
    /** Seconds elapsed in the current period */
    currentPeriodSeconds: number;
  }> {
    const timing = await this.getGameTiming(gameId);
    const halfDuration = (durationMinutes / 2) * 60;

    // If game hasn't started
    if (!timing.actualStart) {
      return {
        period1DurationSeconds: 0,
        period2DurationSeconds: 0,
        currentPeriod: undefined,
        currentPeriodSeconds: 0,
      };
    }

    // Game is completed
    if (timing.actualEnd) {
      const totalSeconds = Math.floor(
        (timing.actualEnd.getTime() - timing.actualStart.getTime()) / 1000,
      );
      // Assume equal halves for completed games without detailed timing
      const period1Duration = timing.firstHalfEnd
        ? Math.floor(
            (timing.firstHalfEnd.getTime() - timing.actualStart.getTime()) /
              1000,
          )
        : Math.min(halfDuration, Math.floor(totalSeconds / 2));
      const period2Duration = timing.secondHalfStart
        ? Math.floor(
            (timing.actualEnd.getTime() - timing.secondHalfStart.getTime()) /
              1000,
          )
        : totalSeconds - period1Duration;

      return {
        period1DurationSeconds: period1Duration,
        period2DurationSeconds: period2Duration,
        currentPeriod: undefined, // Game over
        currentPeriodSeconds: 0,
      };
    }

    // Game in progress
    if (timing.secondHalfStart) {
      // In second half
      const endTime = timing.pausedAt || new Date();
      const period1Duration = timing.firstHalfEnd
        ? Math.floor(
            (timing.firstHalfEnd.getTime() - timing.actualStart.getTime()) /
              1000,
          )
        : halfDuration;
      const currentPeriodSeconds = Math.floor(
        (endTime.getTime() - timing.secondHalfStart.getTime()) / 1000,
      );

      return {
        period1DurationSeconds: period1Duration,
        period2DurationSeconds: currentPeriodSeconds,
        currentPeriod: '2',
        currentPeriodSeconds,
      };
    } else if (timing.firstHalfEnd) {
      // At halftime
      const period1Duration = Math.floor(
        (timing.firstHalfEnd.getTime() - timing.actualStart.getTime()) / 1000,
      );
      return {
        period1DurationSeconds: period1Duration,
        period2DurationSeconds: 0,
        currentPeriod: undefined, // Halftime
        currentPeriodSeconds: 0,
      };
    } else {
      // In first half
      const endTime = timing.pausedAt || new Date();
      const currentPeriodSeconds = Math.floor(
        (endTime.getTime() - timing.actualStart.getTime()) / 1000,
      );

      return {
        period1DurationSeconds: currentPeriodSeconds,
        period2DurationSeconds: 0,
        currentPeriod: '1',
        currentPeriodSeconds,
      };
    }
  }
}
