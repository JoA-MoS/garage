import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';

import { AddToLineupInput } from './dto/add-to-lineup.input';
import { AddToBenchInput } from './dto/add-to-bench.input';
import { SubstitutePlayerInput } from './dto/substitute-player.input';
import { RecordGoalInput } from './dto/record-goal.input';
import { UpdateGoalInput } from './dto/update-goal.input';
import { SwapPositionsInput } from './dto/swap-positions.input';
import { GameLineup, LineupPlayer } from './dto/game-lineup.output';
import {
  PlayerPositionStats,
  PositionTime,
} from './dto/player-position-stats.output';
import { PlayerFullStats } from './dto/player-full-stats.output';
import { PlayerStatsInput } from './dto/player-stats.input';

@Injectable()
export class GameEventsService {
  constructor(
    @InjectRepository(GameEvent)
    private gameEventsRepository: Repository<GameEvent>,
    @InjectRepository(EventType)
    private eventTypesRepository: Repository<EventType>,
    @InjectRepository(GameTeam)
    private gameTeamsRepository: Repository<GameTeam>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>
  ) {}

  private async getEventTypeByName(name: string): Promise<EventType> {
    const eventType = await this.eventTypesRepository.findOne({
      where: { name },
    });
    if (!eventType) {
      throw new NotFoundException(`Event type ${name} not found`);
    }
    return eventType;
  }

  private async getGameTeam(gameTeamId: string): Promise<GameTeam> {
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });
    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }
    return gameTeam;
  }

  async addPlayerToLineup(
    input: AddToLineupInput,
    recordedByUserId: string
  ): Promise<GameEvent> {
    const gameTeam = await this.getGameTeam(input.gameTeamId);
    const eventType = await this.getEventTypeByName('STARTING_LINEUP');

    // Check if player is already in lineup or bench
    await this.ensurePlayerNotInRoster(
      gameTeam.id,
      input.playerId,
      input.externalPlayerName
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

    // Return with relations loaded
    return this.gameEventsRepository.findOneOrFail({
      where: { id: savedEvent.id },
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

  async addPlayerToBench(
    input: AddToBenchInput,
    recordedByUserId: string
  ): Promise<GameEvent> {
    const gameTeam = await this.getGameTeam(input.gameTeamId);
    const eventType = await this.getEventTypeByName('BENCH');

    // Check if player is already in lineup or bench
    await this.ensurePlayerNotInRoster(
      gameTeam.id,
      input.playerId,
      input.externalPlayerName
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

    // Return with relations loaded
    return this.gameEventsRepository.findOneOrFail({
      where: { id: savedEvent.id },
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
        'Can only remove lineup/bench/substitution events'
      );
    }

    await this.gameEventsRepository.remove(gameEvent);
    return true;
  }

  async updatePlayerPosition(
    gameEventId: string,
    position: string
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

  async substitutePlayer(
    input: SubstitutePlayerInput,
    recordedByUserId: string
  ): Promise<GameEvent[]> {
    const gameTeam = await this.getGameTeam(input.gameTeamId);

    // Get the player being subbed out
    const playerOutEvent = await this.gameEventsRepository.findOne({
      where: { id: input.playerOutEventId },
      relations: ['eventType'],
    });

    if (!playerOutEvent) {
      throw new NotFoundException(
        `GameEvent ${input.playerOutEventId} not found`
      );
    }

    const subOutType = await this.getEventTypeByName('SUBSTITUTION_OUT');
    const subInType = await this.getEventTypeByName('SUBSTITUTION_IN');

    // Create SUBSTITUTION_OUT event
    const subOutEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: subOutType.id,
      playerId: playerOutEvent.playerId,
      externalPlayerName: playerOutEvent.externalPlayerName,
      externalPlayerNumber: playerOutEvent.externalPlayerNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      position: playerOutEvent.position,
    });

    const savedSubOut = await this.gameEventsRepository.save(subOutEvent);

    // Create SUBSTITUTION_IN event (takes the position of the player going out)
    const subInEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: subInType.id,
      playerId: input.playerInId,
      externalPlayerName: input.externalPlayerInName,
      externalPlayerNumber: input.externalPlayerInNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      position: playerOutEvent.position,
      parentEventId: savedSubOut.id,
    });

    const savedSubIn = await this.gameEventsRepository.save(subInEvent);

    // Return with relations loaded
    const [subOutWithRelations, subInWithRelations] = await Promise.all([
      this.gameEventsRepository.findOneOrFail({
        where: { id: savedSubOut.id },
        relations: [
          'eventType',
          'player',
          'recordedByUser',
          'gameTeam',
          'game',
          'childEvents',
          'childEvents.eventType',
        ],
      }),
      this.gameEventsRepository.findOneOrFail({
        where: { id: savedSubIn.id },
        relations: [
          'eventType',
          'player',
          'recordedByUser',
          'gameTeam',
          'game',
          'childEvents',
          'childEvents.eventType',
        ],
      }),
    ]);

    return [subOutWithRelations, subInWithRelations];
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

    return {
      gameTeamId,
      formation: gameTeam.formation,
      starters,
      bench,
      currentOnField: Array.from(currentOnField.values()),
    };
  }

  private async ensurePlayerNotInRoster(
    gameTeamId: string,
    playerId?: string,
    externalPlayerName?: string
  ): Promise<void> {
    const lineupEventTypes = await this.eventTypesRepository.find({
      where: [
        { name: 'STARTING_LINEUP' },
        { name: 'BENCH' },
        { name: 'SUBSTITUTION_IN' },
      ],
    });

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
        'Player is already in the lineup or on the bench'
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

  async recordGoal(
    input: RecordGoalInput,
    recordedByUserId: string
  ): Promise<GameEvent> {
    const gameTeam = await this.getGameTeam(input.gameTeamId);
    const goalEventType = await this.getEventTypeByName('GOAL');

    // Create GOAL event
    const goalEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: goalEventType.id,
      playerId: input.scorerId,
      externalPlayerName: input.externalScorerName,
      externalPlayerNumber: input.externalScorerNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
    });

    const savedGoalEvent = await this.gameEventsRepository.save(goalEvent);

    // If assister provided, create ASSIST event linked to the goal
    if (input.assisterId || input.externalAssisterName) {
      const assistEventType = await this.getEventTypeByName('ASSIST');

      const assistEvent = this.gameEventsRepository.create({
        gameId: gameTeam.gameId,
        gameTeamId: input.gameTeamId,
        eventTypeId: assistEventType.id,
        playerId: input.assisterId,
        externalPlayerName: input.externalAssisterName,
        externalPlayerNumber: input.externalAssisterNumber,
        recordedByUserId,
        gameMinute: input.gameMinute,
        gameSecond: input.gameSecond,
        parentEventId: savedGoalEvent.id,
      });

      await this.gameEventsRepository.save(assistEvent);
    }

    // Increment the team's score (handle null case)
    const currentGameTeam = await this.gameTeamsRepository.findOne({
      where: { id: input.gameTeamId },
    });
    if (currentGameTeam) {
      await this.gameTeamsRepository.update(
        { id: input.gameTeamId },
        { finalScore: (currentGameTeam.finalScore ?? 0) + 1 }
      );
    }

    // Return goal event with relations loaded
    return this.gameEventsRepository.findOneOrFail({
      where: { id: savedGoalEvent.id },
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

  async deleteGoal(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType', 'childEvents', 'gameTeam'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'GOAL') {
      throw new BadRequestException(
        'Can only delete GOAL events with this method'
      );
    }

    // Delete child events (e.g., ASSIST)
    if (gameEvent.childEvents && gameEvent.childEvents.length > 0) {
      await this.gameEventsRepository.remove(gameEvent.childEvents);
    }

    // Decrement the team's score
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameEvent.gameTeamId },
    });
    if (gameTeam && (gameTeam.finalScore ?? 0) > 0) {
      await this.gameTeamsRepository.update(
        { id: gameEvent.gameTeamId },
        { finalScore: (gameTeam.finalScore ?? 0) - 1 }
      );
    }

    // Delete the goal event
    await this.gameEventsRepository.remove(gameEvent);
    return true;
  }

  async updateGoal(input: UpdateGoalInput): Promise<GameEvent> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: input.gameEventId },
      relations: ['eventType', 'childEvents', 'childEvents.eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${input.gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'GOAL') {
      throw new BadRequestException(
        'Can only update GOAL events with this method'
      );
    }

    // Update goal event fields
    if (input.scorerId !== undefined) {
      gameEvent.playerId = input.scorerId || undefined;
    }
    if (input.externalScorerName !== undefined) {
      gameEvent.externalPlayerName = input.externalScorerName || undefined;
    }
    if (input.externalScorerNumber !== undefined) {
      gameEvent.externalPlayerNumber = input.externalScorerNumber || undefined;
    }
    if (input.gameMinute !== undefined) {
      gameEvent.gameMinute = input.gameMinute;
    }
    if (input.gameSecond !== undefined) {
      gameEvent.gameSecond = input.gameSecond;
    }

    await this.gameEventsRepository.save(gameEvent);

    // Handle assist event
    const existingAssist = gameEvent.childEvents?.find(
      (e) => e.eventType?.name === 'ASSIST'
    );

    const hasNewAssist = input.assisterId || input.externalAssisterName;
    const shouldClearAssist = input.clearAssist === true;

    if (shouldClearAssist && existingAssist) {
      // Remove existing assist
      await this.gameEventsRepository.remove(existingAssist);
    } else if (hasNewAssist) {
      if (existingAssist) {
        // Update existing assist
        if (input.assisterId !== undefined) {
          existingAssist.playerId = input.assisterId || undefined;
        }
        if (input.externalAssisterName !== undefined) {
          existingAssist.externalPlayerName =
            input.externalAssisterName || undefined;
        }
        if (input.externalAssisterNumber !== undefined) {
          existingAssist.externalPlayerNumber =
            input.externalAssisterNumber || undefined;
        }
        // Sync time with goal
        if (input.gameMinute !== undefined) {
          existingAssist.gameMinute = input.gameMinute;
        }
        if (input.gameSecond !== undefined) {
          existingAssist.gameSecond = input.gameSecond;
        }
        await this.gameEventsRepository.save(existingAssist);
      } else {
        // Create new assist
        const assistEventType = await this.getEventTypeByName('ASSIST');
        const assistEvent = this.gameEventsRepository.create({
          gameId: gameEvent.gameId,
          gameTeamId: gameEvent.gameTeamId,
          eventTypeId: assistEventType.id,
          playerId: input.assisterId,
          externalPlayerName: input.externalAssisterName,
          externalPlayerNumber: input.externalAssisterNumber,
          recordedByUserId: gameEvent.recordedByUserId,
          gameMinute: gameEvent.gameMinute,
          gameSecond: gameEvent.gameSecond,
          parentEventId: gameEvent.id,
        });
        await this.gameEventsRepository.save(assistEvent);
      }
    }

    // Return updated goal event with relations
    return this.gameEventsRepository.findOneOrFail({
      where: { id: input.gameEventId },
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

  async swapPositions(
    input: SwapPositionsInput,
    recordedByUserId: string
  ): Promise<GameEvent[]> {
    const gameTeam = await this.getGameTeam(input.gameTeamId);

    // Get both player events
    const [player1Event, player2Event] = await Promise.all([
      this.gameEventsRepository.findOne({
        where: { id: input.player1EventId },
        relations: ['eventType'],
      }),
      this.gameEventsRepository.findOne({
        where: { id: input.player2EventId },
        relations: ['eventType'],
      }),
    ]);

    if (!player1Event) {
      throw new NotFoundException(
        `GameEvent ${input.player1EventId} not found`
      );
    }
    if (!player2Event) {
      throw new NotFoundException(
        `GameEvent ${input.player2EventId} not found`
      );
    }

    // Both players must have positions
    if (!player1Event.position || !player2Event.position) {
      throw new BadRequestException('Both players must have positions to swap');
    }

    const swapEventType = await this.getEventTypeByName('POSITION_SWAP');

    // Create first POSITION_SWAP event (player 1 gets player 2's position)
    const swap1Event = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: swapEventType.id,
      playerId: player1Event.playerId,
      externalPlayerName: player1Event.externalPlayerName,
      externalPlayerNumber: player1Event.externalPlayerNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      position: player2Event.position, // Player 1 gets player 2's position
    });

    const savedSwap1 = await this.gameEventsRepository.save(swap1Event);

    // Create second POSITION_SWAP event (player 2 gets player 1's position), linked to first
    const swap2Event = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: swapEventType.id,
      playerId: player2Event.playerId,
      externalPlayerName: player2Event.externalPlayerName,
      externalPlayerNumber: player2Event.externalPlayerNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      position: player1Event.position, // Player 2 gets player 1's position
      parentEventId: savedSwap1.id,
    });

    const savedSwap2 = await this.gameEventsRepository.save(swap2Event);

    // Return both events with relations loaded
    const [swap1WithRelations, swap2WithRelations] = await Promise.all([
      this.gameEventsRepository.findOneOrFail({
        where: { id: savedSwap1.id },
        relations: [
          'eventType',
          'player',
          'recordedByUser',
          'gameTeam',
          'game',
          'childEvents',
          'childEvents.eventType',
        ],
      }),
      this.gameEventsRepository.findOneOrFail({
        where: { id: savedSwap2.id },
        relations: [
          'eventType',
          'player',
          'recordedByUser',
          'gameTeam',
          'game',
          'childEvents',
          'childEvents.eventType',
        ],
      }),
    ]);

    return [swap1WithRelations, swap2WithRelations];
  }

  async getPlayerPositionStats(
    gameTeamId: string
  ): Promise<PlayerPositionStats[]> {
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
      relations: ['game'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const game = await this.gamesRepository.findOne({
      where: { id: gameTeam.gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game not found for GameTeam ${gameTeamId}`);
    }

    // Get all events for this game team, ordered by time
    const events = await this.gameEventsRepository.find({
      where: { gameTeamId },
      relations: ['eventType', 'player'],
      order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
    });

    // Calculate current game time in seconds
    const getCurrentGameSeconds = (): number => {
      // If game is completed, use actual end time
      if (game.actualEnd && game.actualStart) {
        return Math.floor(
          (new Date(game.actualEnd).getTime() -
            new Date(game.actualStart).getTime()) /
            1000
        );
      }
      // If game is in progress, calculate from actual start
      if (game.actualStart) {
        const halfDuration =
          ((game.gameFormat?.durationMinutes || 60) / 2) * 60;

        if (game.secondHalfStart) {
          // In second half
          const secondsIntoSecondHalf = Math.floor(
            (Date.now() - new Date(game.secondHalfStart).getTime()) / 1000
          );
          return halfDuration + secondsIntoSecondHalf;
        } else if (game.firstHalfEnd) {
          // At halftime - use first half end
          return Math.floor(
            (new Date(game.firstHalfEnd).getTime() -
              new Date(game.actualStart).getTime()) /
              1000
          );
        } else {
          // In first half
          return Math.floor(
            (Date.now() - new Date(game.actualStart).getTime()) / 1000
          );
        }
      }
      return 0;
    };

    const currentGameSeconds = getCurrentGameSeconds();

    // Track player position time spans
    type PlayerTimeSpan = {
      playerId?: string;
      playerName?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      spans: Array<{
        position: string;
        startSeconds: number;
        endSeconds?: number;
      }>;
    };

    const playerTimeMap: Map<string, PlayerTimeSpan> = new Map();

    // Process events to build time spans
    for (const event of events) {
      const playerKey = event.playerId || event.externalPlayerName || event.id;
      const playerName = event.player
        ? `${event.player.firstName || ''} ${
            event.player.lastName || ''
          }`.trim() || event.player.email
        : undefined;

      const eventSeconds = event.gameMinute * 60 + event.gameSecond;

      let playerData = playerTimeMap.get(playerKey);
      if (!playerData) {
        playerData = {
          playerId: event.playerId,
          playerName,
          externalPlayerName: event.externalPlayerName,
          externalPlayerNumber: event.externalPlayerNumber,
          spans: [],
        };
        playerTimeMap.set(playerKey, playerData);
      }

      switch (event.eventType.name) {
        case 'STARTING_LINEUP':
          // Player starts at this position from minute 0
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: 0,
            });
          }
          break;

        case 'SUBSTITUTION_IN':
          // Player enters at this position
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: eventSeconds,
            });
          }
          break;

        case 'SUBSTITUTION_OUT': {
          // Close any open span for this player
          const openSpan = playerData.spans.find(
            (s) => s.endSeconds === undefined
          );
          if (openSpan) {
            openSpan.endSeconds = eventSeconds;
          }
          break;
        }

        case 'POSITION_SWAP': {
          // Close current span and start new one with new position
          const currentSpan = playerData.spans.find(
            (s) => s.endSeconds === undefined
          );
          if (currentSpan) {
            currentSpan.endSeconds = eventSeconds;
          }
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: eventSeconds,
            });
          }
          break;
        }
      }
    }

    // Calculate stats for each player
    const stats: PlayerPositionStats[] = [];

    for (const [, playerData] of playerTimeMap) {
      const positionTimeMap: Map<string, number> = new Map();
      let totalSeconds = 0;

      for (const span of playerData.spans) {
        const endSeconds = span.endSeconds ?? currentGameSeconds;
        const duration = Math.max(0, endSeconds - span.startSeconds);

        totalSeconds += duration;

        const currentPositionTime = positionTimeMap.get(span.position) || 0;
        positionTimeMap.set(span.position, currentPositionTime + duration);
      }

      // Only include players who have played
      if (totalSeconds > 0) {
        const positionTimes: PositionTime[] = [];
        for (const [position, seconds] of positionTimeMap) {
          positionTimes.push({
            position,
            minutes: Math.floor(seconds / 60),
            seconds: seconds % 60,
          });
        }

        // Sort by time played (descending)
        positionTimes.sort(
          (a, b) => b.minutes * 60 + b.seconds - (a.minutes * 60 + a.seconds)
        );

        stats.push({
          playerId: playerData.playerId,
          playerName: playerData.playerName,
          externalPlayerName: playerData.externalPlayerName,
          externalPlayerNumber: playerData.externalPlayerNumber,
          totalMinutes: Math.floor(totalSeconds / 60),
          totalSeconds: totalSeconds % 60,
          positionTimes,
        });
      }
    }

    // Sort by total time played (descending)
    stats.sort(
      (a, b) =>
        b.totalMinutes * 60 +
        b.totalSeconds -
        (a.totalMinutes * 60 + a.totalSeconds)
    );

    return stats;
  }

  /**
   * Get comprehensive player statistics with flexible filtering
   * @param input - Filter options: teamId (required), gameId (optional), startDate/endDate (optional)
   * @returns Array of player stats with playing time, goals, assists, and games played
   */
  async getPlayerStats(input: PlayerStatsInput): Promise<PlayerFullStats[]> {
    // Verify team exists
    const team = await this.teamsRepository.findOne({
      where: { id: input.teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team ${input.teamId} not found`);
    }

    // Build query for game teams
    const gameTeamsQuery = this.gameTeamsRepository
      .createQueryBuilder('gt')
      .innerJoinAndSelect('gt.game', 'g')
      .where('gt.teamId = :teamId', { teamId: input.teamId });

    // Apply filters
    if (input.gameId) {
      gameTeamsQuery.andWhere('g.id = :gameId', { gameId: input.gameId });
    } else if (input.startDate && input.endDate) {
      gameTeamsQuery.andWhere(
        'g.scheduledStart BETWEEN :startDate AND :endDate',
        {
          startDate: input.startDate,
          endDate: input.endDate,
        }
      );
    }
    // If neither gameId nor dates: no additional filter (all-time stats)

    const gameTeams = await gameTeamsQuery.getMany();

    if (gameTeams.length === 0) {
      return [];
    }

    const gameTeamIds = gameTeams.map((gt) => gt.id);
    const gameMap = new Map<string, Game>();
    gameTeams.forEach((gt) => gameMap.set(gt.id, gt.game));

    // Get all events for these game teams
    const events = await this.gameEventsRepository
      .createQueryBuilder('ge')
      .innerJoinAndSelect('ge.eventType', 'et')
      .leftJoinAndSelect('ge.player', 'p')
      .where('ge.gameTeamId IN (:...gameTeamIds)', { gameTeamIds })
      .orderBy('ge.gameTeamId', 'ASC')
      .addOrderBy('ge.gameMinute', 'ASC')
      .addOrderBy('ge.gameSecond', 'ASC')
      .addOrderBy('ge.createdAt', 'ASC')
      .getMany();

    // Track aggregated stats per player
    type PlayerAggregatedStats = {
      playerId?: string;
      playerName?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      totalSeconds: number;
      positionSecondsMap: Map<string, number>;
      goals: number;
      assists: number;
      gamesPlayed: Set<string>; // Set of gameTeamIds they participated in
    };

    const playerStatsMap: Map<string, PlayerAggregatedStats> = new Map();

    // Helper to get or create player stats entry
    const getPlayerStats = (event: GameEvent): PlayerAggregatedStats => {
      const playerKey = event.playerId || event.externalPlayerName || event.id;
      let stats = playerStatsMap.get(playerKey);
      if (!stats) {
        const playerName = event.player
          ? `${event.player.firstName || ''} ${
              event.player.lastName || ''
            }`.trim() || event.player.email
          : undefined;
        stats = {
          playerId: event.playerId,
          playerName,
          externalPlayerName: event.externalPlayerName,
          externalPlayerNumber: event.externalPlayerNumber,
          totalSeconds: 0,
          positionSecondsMap: new Map(),
          goals: 0,
          assists: 0,
          gamesPlayed: new Set(),
        };
        playerStatsMap.set(playerKey, stats);
      }
      return stats;
    };

    // Helper to calculate game duration in seconds
    const getGameDurationSeconds = (game: Game): number => {
      if (game.actualEnd && game.actualStart) {
        return Math.floor(
          (new Date(game.actualEnd).getTime() -
            new Date(game.actualStart).getTime()) /
            1000
        );
      }
      if (game.actualStart) {
        const halfDuration =
          ((game.gameFormat?.durationMinutes || 60) / 2) * 60;
        if (game.secondHalfStart) {
          const secondsIntoSecondHalf = Math.floor(
            (Date.now() - new Date(game.secondHalfStart).getTime()) / 1000
          );
          return halfDuration + secondsIntoSecondHalf;
        } else if (game.firstHalfEnd) {
          return Math.floor(
            (new Date(game.firstHalfEnd).getTime() -
              new Date(game.actualStart).getTime()) /
              1000
          );
        } else {
          return Math.floor(
            (Date.now() - new Date(game.actualStart).getTime()) / 1000
          );
        }
      }
      return 0;
    };

    // Group events by gameTeamId for processing
    const eventsByGameTeam = new Map<string, GameEvent[]>();
    for (const event of events) {
      const gameTeamEvents = eventsByGameTeam.get(event.gameTeamId) || [];
      gameTeamEvents.push(event);
      eventsByGameTeam.set(event.gameTeamId, gameTeamEvents);
    }

    // Process events for each game team
    for (const [gameTeamId, gameTeamEvents] of eventsByGameTeam) {
      const game = gameMap.get(gameTeamId);
      if (!game) continue;

      const currentGameSeconds = getGameDurationSeconds(game);

      // Track open spans for this game
      type PlayerSpan = {
        position: string;
        startSeconds: number;
      };
      const playerOpenSpans: Map<string, PlayerSpan | null> = new Map();

      for (const event of gameTeamEvents) {
        const playerKey =
          event.playerId || event.externalPlayerName || event.id;
        const playerStats = getPlayerStats(event);
        const eventSeconds = event.gameMinute * 60 + event.gameSecond;

        switch (event.eventType.name) {
          case 'STARTING_LINEUP':
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: 0,
              });
              playerStats.gamesPlayed.add(gameTeamId);
            }
            break;

          case 'SUBSTITUTION_IN':
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: eventSeconds,
              });
              playerStats.gamesPlayed.add(gameTeamId);
            }
            break;

          case 'SUBSTITUTION_OUT': {
            const openSpan = playerOpenSpans.get(playerKey);
            if (openSpan) {
              const duration = Math.max(
                0,
                eventSeconds - openSpan.startSeconds
              );
              playerStats.totalSeconds += duration;
              const currentPositionTime =
                playerStats.positionSecondsMap.get(openSpan.position) || 0;
              playerStats.positionSecondsMap.set(
                openSpan.position,
                currentPositionTime + duration
              );
              playerOpenSpans.set(playerKey, null);
            }
            break;
          }

          case 'POSITION_SWAP': {
            const openSpan = playerOpenSpans.get(playerKey);
            if (openSpan) {
              // Close current span
              const duration = Math.max(
                0,
                eventSeconds - openSpan.startSeconds
              );
              playerStats.totalSeconds += duration;
              const currentPositionTime =
                playerStats.positionSecondsMap.get(openSpan.position) || 0;
              playerStats.positionSecondsMap.set(
                openSpan.position,
                currentPositionTime + duration
              );
            }
            // Start new span with new position
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: eventSeconds,
              });
            }
            break;
          }

          case 'GOAL':
            playerStats.goals += 1;
            playerStats.gamesPlayed.add(gameTeamId);
            break;

          case 'ASSIST':
            playerStats.assists += 1;
            playerStats.gamesPlayed.add(gameTeamId);
            break;

          case 'BENCH':
            // Player on bench - mark as participating in game but not playing
            playerStats.gamesPlayed.add(gameTeamId);
            break;
        }
      }

      // Close any open spans at end of game
      for (const [playerKey, openSpan] of playerOpenSpans) {
        if (openSpan) {
          const playerStats = playerStatsMap.get(playerKey);
          if (playerStats) {
            const duration = Math.max(
              0,
              currentGameSeconds - openSpan.startSeconds
            );
            playerStats.totalSeconds += duration;
            const currentPositionTime =
              playerStats.positionSecondsMap.get(openSpan.position) || 0;
            playerStats.positionSecondsMap.set(
              openSpan.position,
              currentPositionTime + duration
            );
          }
        }
      }
    }

    // Convert to PlayerFullStats array
    const results: PlayerFullStats[] = [];

    for (const [, playerStats] of playerStatsMap) {
      // Skip players who never participated (shouldn't happen, but just in case)
      if (playerStats.gamesPlayed.size === 0) continue;

      const positionTimes: PositionTime[] = [];
      for (const [position, seconds] of playerStats.positionSecondsMap) {
        positionTimes.push({
          position,
          minutes: Math.floor(seconds / 60),
          seconds: seconds % 60,
        });
      }

      // Sort by time played (descending)
      positionTimes.sort(
        (a, b) => b.minutes * 60 + b.seconds - (a.minutes * 60 + a.seconds)
      );

      results.push({
        playerId: playerStats.playerId,
        playerName: playerStats.playerName,
        externalPlayerName: playerStats.externalPlayerName,
        externalPlayerNumber: playerStats.externalPlayerNumber,
        totalMinutes: Math.floor(playerStats.totalSeconds / 60),
        totalSeconds: playerStats.totalSeconds % 60,
        positionTimes,
        goals: playerStats.goals,
        assists: playerStats.assists,
        gamesPlayed: playerStats.gamesPlayed.size,
      });
    }

    // Sort by total time played (descending)
    results.sort(
      (a, b) =>
        b.totalMinutes * 60 +
        b.totalSeconds -
        (a.totalMinutes * 60 + a.totalSeconds)
    );

    return results;
  }
}
