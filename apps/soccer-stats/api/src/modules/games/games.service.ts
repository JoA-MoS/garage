import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';

import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    @InjectRepository(GameFormat)
    private readonly gameFormatRepository: Repository<GameFormat>,
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    @InjectRepository(TeamConfiguration)
    private readonly teamConfigurationRepository: Repository<TeamConfiguration>
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find({
      relations: [
        'gameFormat',
        'gameTeams',
        'gameTeams.team',
        'gameTeams.team.teamPlayers',
        'gameTeams.team.teamPlayers.user',
        'gameTeams.gameEvents',
        'gameTeams.gameEvents.eventType',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.recordedByUser',
        'gameEvents.gameTeam',
      ],
    });
  }

  async findOne(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: [
        'gameFormat',
        'gameTeams',
        'gameTeams.team',
        'gameTeams.team.teamPlayers',
        'gameTeams.team.teamPlayers.user',
        'gameTeams.gameEvents',
        'gameTeams.gameEvents.eventType',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.recordedByUser',
        'gameEvents.gameTeam',
      ],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async create(createGameInput: CreateGameInput): Promise<Game> {
    // Verify that both teams exist
    const homeTeam = await this.teamRepository.findOne({
      where: { id: createGameInput.homeTeamId },
    });
    const awayTeam = await this.teamRepository.findOne({
      where: { id: createGameInput.awayTeamId },
    });

    if (!homeTeam) {
      throw new NotFoundException(
        `Home team with ID ${createGameInput.homeTeamId} not found`
      );
    }
    if (!awayTeam) {
      throw new NotFoundException(
        `Away team with ID ${createGameInput.awayTeamId} not found`
      );
    }

    // Fetch home team's configuration for defaults
    const homeTeamConfig = await this.teamConfigurationRepository.findOne({
      where: { teamId: createGameInput.homeTeamId },
    });

    // Verify that the game format exists
    const gameFormat = await this.gameFormatRepository.findOne({
      where: { id: createGameInput.gameFormatId },
    });

    if (!gameFormat) {
      throw new NotFoundException(
        `Game format with ID ${createGameInput.gameFormatId} not found`
      );
    }

    // Create the game with inherited settings from team configuration
    const game = this.gameRepository.create({
      gameFormatId: createGameInput.gameFormatId,
      statsTrackingLevel: homeTeamConfig?.statsTrackingLevel,
    });

    const savedGame = await this.gameRepository.save(game);

    // Create GameTeam relationships with inherited formation for home team
    const homeGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.homeTeamId,
      teamType: 'home',
      formation: homeTeamConfig?.defaultFormation,
    });

    const awayGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.awayTeamId,
      teamType: 'away',
    });

    await this.gameTeamRepository.save([homeGameTeam, awayGameTeam]);

    return this.findOne(savedGame.id);
  }

  async update(id: string, updateGameInput: UpdateGameInput): Promise<Game> {
    // Handle resetGame flag - reset to SCHEDULED and clear all timestamps
    if (updateGameInput.resetGame) {
      // Optionally clear all game events
      if (updateGameInput.clearEvents) {
        await this.gameEventRepository
          .createQueryBuilder()
          .delete()
          .where('gameId = :gameId', { gameId: id })
          .execute();
      }

      await this.gameRepository
        .createQueryBuilder()
        .update(Game)
        .set({
          status: GameStatus.SCHEDULED,
          actualStart: () => 'NULL',
          firstHalfEnd: () => 'NULL',
          secondHalfStart: () => 'NULL',
          actualEnd: () => 'NULL',
          pausedAt: () => 'NULL',
        })
        .where('id = :id', { id })
        .execute();
      return this.findOne(id);
    }

    // Extract only the fields that don't exist on the Game entity (from CreateGameInput)
    const {
      homeTeamId: _homeTeamId,
      awayTeamId: _awayTeamId,
      gameFormatId: _gameFormatId,
      duration: _duration,
      resetGame: _resetGame,
      clearEvents: _clearEvents,
      ...gameFields
    } = updateGameInput as Record<string, unknown>;

    // Only update with valid Game entity fields
    if (Object.keys(gameFields).length > 0) {
      await this.gameRepository.update(id, gameFields);
    }

    // Convert STARTING_LINEUP events to SUBSTITUTION_IN when game starts
    if (updateGameInput.status === GameStatus.FIRST_HALF) {
      await this.convertStartingLineupToSubstitutionIn(id);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.gameRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Find games involving any of the given teams, filtered by status.
   * Used for user-scoped game queries (upcoming, recent, live).
   *
   * @param teamIds - Team IDs to find games for
   * @param statuses - Game statuses to filter by
   * @param options - Query options (limit, orderBy, orderDirection)
   */
  async findByTeamIds(
    teamIds: string[],
    statuses: GameStatus[],
    options?: {
      limit?: number;
      orderBy?: 'scheduledStart' | 'actualEnd' | 'actualStart' | 'createdAt';
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Game[]> {
    if (teamIds.length === 0) {
      return [];
    }

    // Find game IDs that involve any of the teams
    const gameTeams = await this.gameTeamRepository.find({
      where: { teamId: In(teamIds) },
      select: ['gameId'],
    });

    const gameIds = [...new Set(gameTeams.map((gt) => gt.gameId))];

    if (gameIds.length === 0) {
      return [];
    }

    // Build query
    const queryBuilder = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.gameFormat', 'gameFormat')
      .leftJoinAndSelect('game.gameTeams', 'gameTeams')
      .leftJoinAndSelect('gameTeams.team', 'team')
      .where('game.id IN (:...gameIds)', { gameIds })
      .andWhere('game.status IN (:...statuses)', { statuses });

    // Apply ordering
    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDirection = options?.orderDirection ?? 'DESC';
    queryBuilder.orderBy(`game.${orderBy}`, orderDirection, 'NULLS LAST');
    queryBuilder.addOrderBy('game.createdAt', 'DESC');

    // Apply limit
    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Converts all STARTING_LINEUP events for a game to SUBSTITUTION_IN events.
   * Called when a game transitions to FIRST_HALF status.
   */
  private async convertStartingLineupToSubstitutionIn(
    gameId: string
  ): Promise<void> {
    // Find STARTING_LINEUP event type
    const startingLineupType = await this.eventTypeRepository.findOne({
      where: { name: 'STARTING_LINEUP' },
    });

    if (!startingLineupType) {
      console.warn('STARTING_LINEUP event type not found');
      return;
    }

    // Find SUBSTITUTION_IN event type
    const substitutionInType = await this.eventTypeRepository.findOne({
      where: { name: 'SUBSTITUTION_IN' },
    });

    if (!substitutionInType) {
      console.warn('SUBSTITUTION_IN event type not found');
      return;
    }

    // Find all STARTING_LINEUP events for this game
    const startingLineupEvents = await this.gameEventRepository.find({
      where: { gameId, eventTypeId: startingLineupType.id },
    });

    // Update each event's eventTypeId to SUBSTITUTION_IN
    for (const event of startingLineupEvents) {
      event.eventTypeId = substitutionInType.id;
      await this.gameEventRepository.save(event);
    }

    console.log(
      `Converted ${startingLineupEvents.length} STARTING_LINEUP events to SUBSTITUTION_IN for game ${gameId}`
    );
  }
}
