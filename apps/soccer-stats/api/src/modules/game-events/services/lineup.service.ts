import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { AddToLineupInput } from '../dto/add-to-lineup.input';
import { AddToBenchInput } from '../dto/add-to-bench.input';
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

  async addPlayerToLineup(
    input: AddToLineupInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    // Lineup entries require player info
    this.coreService.ensurePlayerInfoProvided(
      input.playerId,
      input.externalPlayerName,
      'lineup entry',
    );

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const eventType = this.coreService.getEventTypeByName('STARTING_LINEUP');

    // Check if player is already in lineup or bench
    await this.ensurePlayerNotInRoster(
      gameTeam.id,
      input.playerId,
      input.externalPlayerName,
    );

    const gameEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: eventType.id,
      playerId: input.playerId,
      externalPlayerName: input.externalPlayerName,
      externalPlayerNumber: input.externalPlayerNumber,
      position: input.position,
      recordedByUserId,
      gameMinute: 0,
      gameSecond: 0,
    });

    const savedEvent = await this.gameEventsRepository.save(gameEvent);

    return this.coreService.loadEventWithRelations(savedEvent.id);
  }

  async addPlayerToBench(
    input: AddToBenchInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    // Bench entries require player info
    this.coreService.ensurePlayerInfoProvided(
      input.playerId,
      input.externalPlayerName,
      'bench entry',
    );

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const eventType = this.coreService.getEventTypeByName('BENCH');

    // Check if player is already in lineup or bench
    await this.ensurePlayerNotInRoster(
      gameTeam.id,
      input.playerId,
      input.externalPlayerName,
    );

    const gameEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: eventType.id,
      playerId: input.playerId,
      externalPlayerName: input.externalPlayerName,
      externalPlayerNumber: input.externalPlayerNumber,
      recordedByUserId,
      gameMinute: 0,
      gameSecond: 0,
    });

    const savedEvent = await this.gameEventsRepository.save(gameEvent);

    return this.coreService.loadEventWithRelations(savedEvent.id);
  }

  async removeFromLineup(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    const lineupEventTypes = ['STARTING_LINEUP', 'BENCH', 'SUBSTITUTION_IN'];
    if (!lineupEventTypes.includes(gameEvent.eventType.name)) {
      throw new BadRequestException(
        'Can only remove lineup/bench/substitution events',
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
      order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
    });

    const starters: LineupPlayer[] = [];
    const bench: LineupPlayer[] = [];
    const currentOnField: Map<string, LineupPlayer> = new Map();

    // Track all players and their current on-field status
    const playerStatusMap: Map<
      string,
      { isOnField: boolean; latestEvent: LineupPlayer }
    > = new Map();

    for (const event of events) {
      const lineupPlayer: LineupPlayer = {
        gameEventId: event.id,
        playerId: event.playerId,
        playerName: event.player
          ? `${event.player.firstName || ''} ${
              event.player.lastName || ''
            }`.trim() || event.player.email
          : undefined,
        firstName: event.player?.firstName,
        lastName: event.player?.lastName,
        externalPlayerName: event.externalPlayerName,
        externalPlayerNumber: event.externalPlayerNumber,
        position: event.position,
        isOnField: false,
      };

      const playerKey = event.playerId || event.externalPlayerName || event.id;

      switch (event.eventType.name) {
        case 'STARTING_LINEUP':
          lineupPlayer.isOnField = true;
          starters.push(lineupPlayer);
          currentOnField.set(playerKey, lineupPlayer);
          playerStatusMap.set(playerKey, {
            isOnField: true,
            latestEvent: lineupPlayer,
          });
          break;

        case 'BENCH':
          lineupPlayer.isOnField = false;
          bench.push(lineupPlayer);
          playerStatusMap.set(playerKey, {
            isOnField: false,
            latestEvent: lineupPlayer,
          });
          break;

        case 'SUBSTITUTION_OUT': {
          // Player going off the field
          currentOnField.delete(playerKey);
          // Update their status - they're now off field but still in the game
          const outStatus = playerStatusMap.get(playerKey);
          if (outStatus) {
            outStatus.isOnField = false;
            outStatus.latestEvent.isOnField = false;
          }
          // Add them to bench as available for sub (with the SUB_OUT event info for tracking)
          lineupPlayer.isOnField = false;
          bench.push(lineupPlayer);
          playerStatusMap.set(playerKey, {
            isOnField: false,
            latestEvent: lineupPlayer,
          });
          break;
        }

        case 'SUBSTITUTION_IN': {
          lineupPlayer.isOnField = true;
          currentOnField.set(playerKey, lineupPlayer);

          // If this is a SUBSTITUTION_IN at minute 0, treat as a starter
          // (this happens when STARTING_LINEUP events are converted on game start)
          if (event.gameMinute === 0 && event.gameSecond === 0) {
            starters.push(lineupPlayer);
          }

          // Update their status
          const inStatus = playerStatusMap.get(playerKey);
          if (inStatus) {
            inStatus.isOnField = true;
            inStatus.latestEvent.isOnField = true;
          }
          playerStatusMap.set(playerKey, {
            isOnField: true,
            latestEvent: lineupPlayer,
          });
          break;
        }

        case 'POSITION_SWAP':
        case 'POSITION_CHANGE': {
          // Update the player's position in currentOnField
          // The event's position field contains the NEW position
          const existingOnField = currentOnField.get(playerKey);
          if (existingOnField) {
            existingOnField.position = event.position;
          }
          // Also update the lineupPlayer and status map
          lineupPlayer.isOnField = true;
          lineupPlayer.position = event.position;
          currentOnField.set(playerKey, lineupPlayer);
          playerStatusMap.set(playerKey, {
            isOnField: true,
            latestEvent: lineupPlayer,
          });
          break;
        }
      }
    }

    // Final pass: update isOnField for all players based on final status
    for (const starter of starters) {
      const key =
        starter.playerId || starter.externalPlayerName || starter.gameEventId;
      const status = playerStatusMap.get(key);
      if (status) {
        starter.isOnField = status.isOnField;
      }
    }

    for (const benchPlayer of bench) {
      const key =
        benchPlayer.playerId ||
        benchPlayer.externalPlayerName ||
        benchPlayer.gameEventId;
      const status = playerStatusMap.get(key);
      if (status) {
        benchPlayer.isOnField = status.isOnField;
      }
    }

    // Filter bench to only include players NOT currently on field
    // (players who were subbed out and then subbed back in should not appear in bench)
    const filteredBench = bench.filter((player) => {
      const key =
        player.playerId || player.externalPlayerName || player.gameEventId;
      const status = playerStatusMap.get(key);
      return status && !status.isOnField;
    });

    return {
      gameTeamId,
      formation: gameTeam.formation,
      starters,
      bench: filteredBench,
      currentOnField: Array.from(currentOnField.values()),
    };
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
      this.coreService.getEventTypeByName('STARTING_LINEUP'),
      this.coreService.getEventTypeByName('BENCH'),
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
      order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
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
