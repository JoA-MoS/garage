import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { UpdateGameTeamInput } from './dto/update-game-team.input';

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

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
    private readonly teamConfigurationRepository: Repository<TeamConfiguration>,
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
        'gameTeams.gameEvents.player',
        'gameTeams.gameEvents.childEvents',
        'gameTeams.gameEvents.childEvents.player',
        'gameTeams.gameEvents.childEvents.eventType',
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
        'gameTeams.gameEvents.player',
        'gameTeams.gameEvents.childEvents',
        'gameTeams.gameEvents.childEvents.player',
        'gameTeams.gameEvents.childEvents.eventType',
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
        `Home team with ID ${createGameInput.homeTeamId} not found`,
      );
    }
    if (!awayTeam) {
      throw new NotFoundException(
        `Away team with ID ${createGameInput.awayTeamId} not found`,
      );
    }

    // Fetch both teams' configurations for defaults
    const homeTeamConfig = await this.teamConfigurationRepository.findOne({
      where: { teamId: createGameInput.homeTeamId },
    });

    const awayTeamConfig = await this.teamConfigurationRepository.findOne({
      where: { teamId: createGameInput.awayTeamId },
    });

    // Verify that the game format exists
    const gameFormat = await this.gameFormatRepository.findOne({
      where: { id: createGameInput.gameFormatId },
    });

    if (!gameFormat) {
      throw new NotFoundException(
        `Game format with ID ${createGameInput.gameFormatId} not found`,
      );
    }

    // Create the game with inherited settings from team configuration
    const game = this.gameRepository.create({
      gameFormatId: createGameInput.gameFormatId,
      durationMinutes: createGameInput.duration,
      statsTrackingLevel: homeTeamConfig?.statsTrackingLevel,
    });

    const savedGame = await this.gameRepository.save(game);

    // Create GameTeam relationships with inherited settings from team configurations
    const homeGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.homeTeamId,
      teamType: 'home',
      formation: homeTeamConfig?.defaultFormation,
      statsTrackingLevel: homeTeamConfig?.statsTrackingLevel,
    });

    const awayGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.awayTeamId,
      teamType: 'away',
      statsTrackingLevel: awayTeamConfig?.statsTrackingLevel,
    });

    await this.gameTeamRepository.save([homeGameTeam, awayGameTeam]);

    return this.findOne(savedGame.id);
  }

  async update(
    id: string,
    updateGameInput: UpdateGameInput,
    userId?: string,
  ): Promise<Game> {
    // Handle resetGame flag - reset to SCHEDULED and clear timing
    if (updateGameInput.resetGame) {
      if (updateGameInput.clearEvents) {
        // Clear ALL game events
        await this.gameEventRepository
          .createQueryBuilder()
          .delete()
          .where('gameId = :gameId', { gameId: id })
          .execute();
      } else {
        // Clear only timing events (event-based timing model)
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
        const timingEventTypeIds = timingEventTypes.map((et) => et.id);

        if (timingEventTypeIds.length > 0) {
          await this.gameEventRepository
            .createQueryBuilder()
            .delete()
            .where('gameId = :gameId', { gameId: id })
            .andWhere('eventTypeId IN (:...timingEventTypeIds)', {
              timingEventTypeIds,
            })
            .execute();
        }
      }

      // Reset status and clear legacy timing columns (kept for backward compatibility)
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

    // Extract fields that should not be passed directly to entity update
    // Timing fields are now derived from events, not stored as columns
    const {
      homeTeamId: _homeTeamId,
      awayTeamId: _awayTeamId,
      gameFormatId: _gameFormatId,
      duration,
      resetGame: _resetGame,
      clearEvents: _clearEvents,
      actualStart: _actualStart,
      firstHalfEnd: _firstHalfEnd,
      secondHalfStart: _secondHalfStart,
      actualEnd: _actualEnd,
      pausedAt: inputPausedAt,
      ...gameFields
    } = updateGameInput as Record<string, unknown>;

    // Map duration input to durationMinutes entity field
    const entityFields = {
      ...gameFields,
      ...(duration !== undefined && { durationMinutes: duration as number }),
    };

    // Only update with valid Game entity fields (excludes timing fields)
    if (Object.keys(entityFields).length > 0) {
      await this.gameRepository.update(id, entityFields);
    }

    // Create timing events based on status changes
    await this.createTimingEventsForStatusChange(
      id,
      updateGameInput.status,
      userId,
    );

    // Handle pause/resume via events
    if (inputPausedAt !== undefined) {
      await this.handlePauseResumeEvent(
        id,
        inputPausedAt as Date | null,
        userId,
      );
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
   * Update a GameTeam's settings (formation, stats tracking level, etc.)
   */
  async updateGameTeam(
    gameTeamId: string,
    updateGameTeamInput: UpdateGameTeamInput,
  ): Promise<GameTeam> {
    const gameTeam = await this.gameTeamRepository.findOne({
      where: { id: gameTeamId },
      relations: ['team', 'game'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam with ID ${gameTeamId} not found`);
    }

    // Update only provided fields
    if (updateGameTeamInput.formation !== undefined) {
      gameTeam.formation = updateGameTeamInput.formation;
    }
    if (updateGameTeamInput.statsTrackingLevel !== undefined) {
      gameTeam.statsTrackingLevel = updateGameTeamInput.statsTrackingLevel;
    }
    if (updateGameTeamInput.tacticalNotes !== undefined) {
      gameTeam.tacticalNotes = updateGameTeamInput.tacticalNotes;
    }

    await this.gameTeamRepository.save(gameTeam);

    // Return with full relations for GraphQL
    const updatedGameTeam = await this.gameTeamRepository.findOne({
      where: { id: gameTeamId },
      relations: [
        'team',
        'team.teamPlayers',
        'team.teamPlayers.user',
        'game',
        'gameEvents',
        'gameEvents.eventType',
      ],
    });

    if (!updatedGameTeam) {
      throw new NotFoundException(
        `GameTeam with ID ${gameTeamId} not found after update`,
      );
    }

    return updatedGameTeam;
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
    },
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
    gameId: string,
  ): Promise<void> {
    // Find STARTING_LINEUP event type
    const startingLineupType = await this.eventTypeRepository.findOne({
      where: { name: 'STARTING_LINEUP' },
    });

    if (!startingLineupType) {
      this.logger.warn('STARTING_LINEUP event type not found');
      return;
    }

    // Find SUBSTITUTION_IN event type
    const substitutionInType = await this.eventTypeRepository.findOne({
      where: { name: 'SUBSTITUTION_IN' },
    });

    if (!substitutionInType) {
      this.logger.warn('SUBSTITUTION_IN event type not found');
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

    this.logger.log(
      `Converted ${startingLineupEvents.length} STARTING_LINEUP events to SUBSTITUTION_IN for game ${gameId}`,
    );
  }

  /**
   * Creates timing events based on game status changes.
   * This replaces direct column updates with event-based timing.
   *
   * @throws Error if required event types are not found in the database
   */
  private async createTimingEventsForStatusChange(
    gameId: string,
    status?: GameStatus,
    userId?: string,
  ): Promise<void> {
    if (!status) return;

    const requiredEventTypes = [
      'GAME_START',
      'GAME_END',
      'PERIOD_START',
      'PERIOD_END',
    ];

    const eventTypeMap = new Map<string, EventType>();
    const eventTypes = await this.eventTypeRepository.find({
      where: requiredEventTypes.map((name) => ({ name })),
    });
    eventTypes.forEach((et) => eventTypeMap.set(et.name, et));

    // Validate all required event types exist
    const missingTypes = requiredEventTypes.filter(
      (name) => !eventTypeMap.has(name),
    );
    if (missingTypes.length > 0) {
      const errorMsg =
        `Cannot create timing events: missing event types [${missingTypes.join(', ')}]. ` +
        'Database may not be properly seeded.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get home team's gameTeamId for timing events (game-level events use home team)
    const homeGameTeam = await this.gameTeamRepository.findOne({
      where: { gameId, teamType: 'home' },
    });
    if (!homeGameTeam) {
      throw new Error(`Home team not found for game ${gameId}`);
    }

    const createEvent = async (
      eventTypeName: string,
      metadata?: Record<string, unknown>,
    ) => {
      const eventType = eventTypeMap.get(eventTypeName);
      // This should never happen due to validation above, but TypeScript needs the check
      if (!eventType) {
        throw new Error(
          `Event type ${eventTypeName} not found after validation`,
        );
      }

      const event = this.gameEventRepository.create({
        gameId,
        gameTeamId: homeGameTeam.id,
        eventTypeId: eventType.id,
        recordedByUserId: userId,
        gameMinute: 0,
        gameSecond: 0,
        metadata,
      });
      await this.gameEventRepository.save(event);
    };

    switch (status) {
      case GameStatus.FIRST_HALF:
        // Game starting: create GAME_START and PERIOD_START (period 1)
        await createEvent('GAME_START');
        await createEvent('PERIOD_START', { period: '1' });
        break;

      case GameStatus.HALFTIME:
        // First half ending: create PERIOD_END (period 1)
        await createEvent('PERIOD_END', { period: '1' });
        break;

      case GameStatus.SECOND_HALF:
        // Second half starting: create PERIOD_START (period 2)
        await createEvent('PERIOD_START', { period: '2' });
        break;

      case GameStatus.COMPLETED:
        // Game ending: create PERIOD_END (period 2) and GAME_END
        await createEvent('PERIOD_END', { period: '2' });
        await createEvent('GAME_END');
        break;
    }
  }

  /**
   * Creates stoppage events for pause/resume functionality.
   * pausedAt = Date means pause (create STOPPAGE_START)
   * pausedAt = null means resume (create STOPPAGE_END)
   *
   * @throws Error if required event type is not found in the database
   */
  private async handlePauseResumeEvent(
    gameId: string,
    pausedAt: Date | null,
    userId?: string,
  ): Promise<void> {
    const eventTypeName = pausedAt ? 'STOPPAGE_START' : 'STOPPAGE_END';

    const eventType = await this.eventTypeRepository.findOne({
      where: { name: eventTypeName },
    });

    if (!eventType) {
      const errorMsg =
        `Cannot ${pausedAt ? 'pause' : 'resume'} game: ` +
        `event type ${eventTypeName} not found. Database may not be properly seeded.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Get home team's gameTeamId for timing events (game-level events use home team)
    const homeGameTeam = await this.gameTeamRepository.findOne({
      where: { gameId, teamType: 'home' },
    });
    if (!homeGameTeam) {
      throw new Error(`Home team not found for game ${gameId}`);
    }

    const event = this.gameEventRepository.create({
      gameId,
      gameTeamId: homeGameTeam.id,
      eventTypeId: eventType.id,
      recordedByUserId: userId,
      gameMinute: 0,
      gameSecond: 0,
    });
    await this.gameEventRepository.save(event);
  }
}
