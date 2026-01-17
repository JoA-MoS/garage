import { Injectable } from '@nestjs/common';
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

/**
 * Service to derive game timing from timing events.
 *
 * This replaces the legacy timing columns (actualStart, firstHalfEnd, etc.)
 * with event-based computation. The source of truth is now timing events:
 * - GAME_START, GAME_END
 * - PERIOD_START, PERIOD_END (with metadata.period)
 * - STOPPAGE_START, STOPPAGE_END
 */
@Injectable()
export class GameTimingService {
  constructor(
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
  ) {}

  /**
   * Get computed timing for a game from its timing events.
   */
  async getGameTiming(gameId: string): Promise<GameTiming> {
    // Get timing event types
    const timingEventTypes = await this.eventTypeRepository.find({
      where: [
        { name: 'GAME_START' },
        { name: 'GAME_END' },
        { name: 'PERIOD_START' },
        { name: 'PERIOD_END' },
        { name: 'STOPPAGE_START' },
        { name: 'STOPPAGE_END' },
      ],
    });

    const eventTypeIds = timingEventTypes.map((et) => et.id);
    const eventTypeMap = new Map(
      timingEventTypes.map((et) => [et.id, et.name]),
    );

    if (eventTypeIds.length === 0) {
      return {};
    }

    // Get all timing events for this game
    const events = await this.gameEventRepository
      .createQueryBuilder('ge')
      .where('ge.gameId = :gameId', { gameId })
      .andWhere('ge.eventTypeId IN (:...eventTypeIds)', { eventTypeIds })
      .orderBy('ge.createdAt', 'ASC')
      .getMany();

    const timing: GameTiming = {};

    // Track stoppage events to determine if currently paused
    let lastStoppageStart: Date | undefined;

    for (const event of events) {
      const eventTypeName = eventTypeMap.get(event.eventTypeId);
      const period = (event.metadata as { period?: string } | undefined)
        ?.period;

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
}
