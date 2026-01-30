import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameLineup, LineupPlayer } from '../dto/game-lineup.output';

import { EventCoreService } from './event-core.service';

/**
 * Service responsible for roster and lineup management operations.
 * Handles adding/removing players from lineup and bench.
 */
@Injectable()
export class LineupService {
  constructor(private readonly coreService: EventCoreService) {}

  // Expose repositories through coreService for convenience
  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  async removeFromLineup(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    const lineupEventTypes = ['GAME_ROSTER', 'SUBSTITUTION_IN'];
    if (!lineupEventTypes.includes(gameEvent.eventType.name)) {
      throw new BadRequestException(
        'Can only remove game roster/substitution events',
      );
    }

    await this.gameEventsRepository.remove(gameEvent);
    return true;
  }

  async updatePlayerPosition(
    gameEventId: string,
    position: string,
  ): Promise<GameEvent> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    gameEvent.position = position;
    return this.gameEventsRepository.save(gameEvent);
  }

  async getGameLineup(gameTeamId: string): Promise<GameLineup> {
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const events = await this.gameEventsRepository.find({
      where: { gameTeamId },
      relations: ['eventType', 'player'],
      order: { createdAt: 'ASC' },
    });

    // 1. Build game roster from GAME_ROSTER events
    const gameRoster: LineupPlayer[] = [];

    for (const event of events) {
      if (event.eventType.name === 'GAME_ROSTER') {
        gameRoster.push(this.toLineupPlayer(event));
      }
    }

    // 2. Track current on-field status and last positions
    const currentOnField = new Map<string, LineupPlayer>();
    const lastPositions = new Map<string, string>();
    const starters: LineupPlayer[] = [];

    for (const event of events) {
      const key = this.getPlayerKey(event);

      if (event.eventType.name === 'SUBSTITUTION_IN') {
        const player = this.toLineupPlayer(event);
        player.isOnField = true;
        currentOnField.set(key, player);
        lastPositions.set(key, event.position || '');

        // Track starters (period 1, second 0)
        if (event.period === '1' && event.periodSecond === 0) {
          starters.push(player);
        }
      } else if (event.eventType.name === 'SUBSTITUTION_OUT') {
        currentOnField.delete(key);
        lastPositions.set(key, event.position || '');
      } else if (
        event.eventType.name === 'POSITION_SWAP' ||
        event.eventType.name === 'POSITION_CHANGE'
      ) {
        // Update position for players still on field
        const existingOnField = currentOnField.get(key);
        if (existingOnField) {
          existingOnField.position = event.position;
          lastPositions.set(key, event.position || '');
        }
      }
    }

    // 3. Build bench (roster members not on field)
    const onFieldKeys = new Set(currentOnField.keys());
    const bench = gameRoster
      .filter((p) => !onFieldKeys.has(this.getPlayerKeyFromLineup(p)))
      .map((p) => {
        const key = this.getPlayerKeyFromLineup(p);
        return {
          ...p,
          position: lastPositions.get(key) ?? p.position,
          isOnField: false,
        };
      });

    // 4. Get previous period lineup (for halftime pre-fill)
    const periodEndEvent = events.find(
      (e) => e.eventType.name === 'PERIOD_END',
    );
    const previousPeriodLineup = periodEndEvent
      ? events
          .filter(
            (e) =>
              e.eventType.name === 'SUBSTITUTION_OUT' &&
              e.parentEventId === periodEndEvent.id,
          )
          .map((e) => this.toLineupPlayer(e))
      : undefined;

    return {
      gameTeamId,
      formation: gameTeam.formation,
      gameRoster,
      starters,
      bench,
      currentOnField: Array.from(currentOnField.values()),
      previousPeriodLineup,
    };
  }

  /**
   * Convert a GameEvent to a LineupPlayer object
   */
  private toLineupPlayer(event: GameEvent): LineupPlayer {
    return {
      gameEventId: event.id,
      playerId: event.playerId,
      playerName: event.player
        ? `${event.player.firstName || ''} ${event.player.lastName || ''}`.trim() ||
          event.player.email
        : undefined,
      firstName: event.player?.firstName,
      lastName: event.player?.lastName,
      externalPlayerName: event.externalPlayerName,
      externalPlayerNumber: event.externalPlayerNumber,
      position: event.position,
      isOnField: false,
    };
  }

  /**
   * Get a unique key for a player from a GameEvent
   */
  private getPlayerKey(event: GameEvent): string {
    return event.playerId || event.externalPlayerName || event.id;
  }

  /**
   * Get a unique key for a player from a LineupPlayer
   */
  private getPlayerKeyFromLineup(player: LineupPlayer): string {
    return player.playerId || player.externalPlayerName || player.gameEventId;
  }

  /**
   * Ensure player is not already in the roster (lineup or bench).
   * @throws BadRequestException if player is already in roster
   */
  async ensurePlayerNotInRoster(
    gameTeamId: string,
    playerId?: string,
    externalPlayerName?: string,
  ): Promise<void> {
    // Use cached event types instead of querying the database
    const lineupEventTypes = [
      this.coreService.getEventTypeByName('GAME_ROSTER'),
      this.coreService.getEventTypeByName('SUBSTITUTION_IN'),
    ];

    const eventTypeIds = lineupEventTypes.map((et) => et.id);

    let existingEvent: GameEvent | null = null;

    if (playerId) {
      existingEvent = await this.gameEventsRepository
        .createQueryBuilder('ge')
        .where('ge.gameTeamId = :gameTeamId', { gameTeamId })
        .andWhere('ge.playerId = :playerId', { playerId })
        .andWhere('ge.eventTypeId IN (:...eventTypeIds)', { eventTypeIds })
        .getOne();
    } else if (externalPlayerName) {
      existingEvent = await this.gameEventsRepository
        .createQueryBuilder('ge')
        .where('ge.gameTeamId = :gameTeamId', { gameTeamId })
        .andWhere('ge.externalPlayerName = :externalPlayerName', {
          externalPlayerName,
        })
        .andWhere('ge.eventTypeId IN (:...eventTypeIds)', { eventTypeIds })
        .getOne();
    }

    if (existingEvent) {
      throw new BadRequestException(
        'Player is already in the lineup or on the bench',
      );
    }
  }

  async findEventsByGameTeam(gameTeamId: string): Promise<GameEvent[]> {
    return this.gameEventsRepository.find({
      where: { gameTeamId },
      relations: [
        'eventType',
        'player',
        'parentEvent',
        'childEvents',
        'childEvents.eventType',
      ],
      order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<GameEvent | null> {
    return this.gameEventsRepository.findOne({
      where: { id },
      relations: [
        'eventType',
        'player',
        'gameTeam',
        'parentEvent',
        'childEvents',
        'childEvents.eventType',
      ],
    });
  }
}
