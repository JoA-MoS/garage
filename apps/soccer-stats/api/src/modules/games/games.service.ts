import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { PubSub } from 'graphql-subscriptions';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { GameEventsService } from '../game-events/game-events.service';
import {
  GameEventAction,
  GameEventSubscriptionPayload,
} from '../game-events/dto/game-event-subscription.output';

import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { UpdateGameTeamInput } from './dto/update-game-team.input';
import { GameTimingService } from './game-timing.service';

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
    @Inject(forwardRef(() => GameEventsService))
    private readonly gameEventsService: GameEventsService,
    private readonly gameTimingService: GameTimingService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  /**
   * Find all games.
   *
   * IMPORTANT: This method intentionally does NOT eager-load relations.
   * Relations are loaded on-demand via GraphQL field resolvers + DataLoaders.
   * This prevents memory issues when loading games with many events.
   *
   * @see game-fields.resolver.ts for field resolvers
   * @see dataloaders.service.ts for DataLoader implementations
   */
  async findAll(): Promise<Game[]> {
    return this.gameRepository.find();
  }

  /**
   * Find a game by ID.
   *
   * IMPORTANT: This method intentionally does NOT eager-load relations.
   * Relations are loaded on-demand via GraphQL field resolvers + DataLoaders.
   * This prevents memory issues when loading games with many events.
   *
   * @see game-fields.resolver.ts for field resolvers
   * @see dataloaders.service.ts for DataLoader implementations
   */
  async findOne(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id },
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
    // gameMinute/gameSecond are used for event timing, not stored on Game entity
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
      gameMinute: _gameMinute,
      gameSecond: _gameSecond,
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

    // Convert STARTING_LINEUP events to SUBSTITUTION_IN when game starts
    // This MUST happen BEFORE createTimingEventsForStatusChange because
    // linkFirstHalfStartersToPeriodStart looks for SUBSTITUTION_IN events
    if (updateGameInput.status === GameStatus.FIRST_HALF) {
      await this.convertStartingLineupToSubstitutionIn(id);
    }

    // Create timing events based on status changes
    // Pass game time from frontend for consistent timing with displayed timer
    const providedGameTime =
      updateGameInput.gameMinute !== undefined &&
      updateGameInput.gameSecond !== undefined
        ? {
            gameMinute: updateGameInput.gameMinute,
            gameSecond: updateGameInput.gameSecond,
          }
        : undefined;

    await this.createTimingEventsForStatusChange(
      id,
      updateGameInput.status,
      userId,
      providedGameTime,
    );

    // Handle pause/resume via events
    if (inputPausedAt !== undefined) {
      // Validate and normalize pausedAt input
      let normalizedPausedAt: Date | null;
      if (inputPausedAt === null) {
        normalizedPausedAt = null;
      } else if (inputPausedAt instanceof Date) {
        normalizedPausedAt = inputPausedAt;
      } else if (typeof inputPausedAt === 'string') {
        normalizedPausedAt = new Date(inputPausedAt);
        if (isNaN(normalizedPausedAt.getTime())) {
          throw new Error(`Invalid pausedAt date string: ${inputPausedAt}`);
        }
      } else {
        throw new Error(
          `Invalid pausedAt type: expected Date, string, or null, got ${typeof inputPausedAt}`,
        );
      }

      await this.handlePauseResumeEvent(id, normalizedPausedAt, userId);
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
      .leftJoinAndSelect('game.format', 'gameFormat')
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
   * @param providedGameTime - Optional game minute/second from frontend for the status change.
   *                          Used to ensure consistent timing between frontend timer and events.
   * @throws Error if required event types are not found in the database
   * @throws Error if userId is not provided for status changes that create timing events
   */
  private async createTimingEventsForStatusChange(
    gameId: string,
    status?: GameStatus,
    userId?: string,
    providedGameTime?: { gameMinute: number; gameSecond: number },
  ): Promise<void> {
    if (!status) return;

    // Validate userId is provided for status changes that create timing events
    const statusesRequiringEvents: GameStatus[] = [
      GameStatus.FIRST_HALF,
      GameStatus.HALFTIME,
      GameStatus.SECOND_HALF,
      GameStatus.COMPLETED,
    ];
    if (statusesRequiringEvents.includes(status) && !userId) {
      throw new Error(
        `Cannot create timing events for status ${status}: userId is required`,
      );
    }

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
      gameMinute = 0,
      gameSecond = 0,
      skipPublish = false,
      parentEventId?: string,
    ): Promise<GameEvent> => {
      const eventType = eventTypeMap.get(eventTypeName);
      // This should never happen due to validation above, but TypeScript needs the check
      if (!eventType) {
        throw new Error(
          `Event type ${eventTypeName} not found after validation`,
        );
      }

      // Idempotency check: skip if this event already exists for the game
      // For period events, also check metadata.period matches
      const existingEventQuery = this.gameEventRepository
        .createQueryBuilder('event')
        .where('event.gameId = :gameId', { gameId })
        .andWhere('event.eventTypeId = :eventTypeId', {
          eventTypeId: eventType.id,
        });

      // For PERIOD_START/PERIOD_END, check the specific period
      if (metadata?.period) {
        existingEventQuery.andWhere("event.metadata->>'period' = :period", {
          period: metadata.period,
        });
      }

      const existingEvent = await existingEventQuery.getOne();
      if (existingEvent) {
        this.logger.debug(
          `Skipping duplicate ${eventTypeName} event for game ${gameId}` +
            (metadata?.period ? ` (period ${metadata.period})` : ''),
        );
        return existingEvent;
      }

      const event = this.gameEventRepository.create({
        gameId,
        gameTeamId: homeGameTeam.id,
        eventTypeId: eventType.id,
        recordedByUserId: userId,
        gameMinute,
        gameSecond,
        metadata,
        parentEventId,
      });
      const savedEvent = await this.gameEventRepository.save(event);

      // Fetch the event with relations needed for subscription payload
      // Include childEvents to satisfy GraphQL schema (non-nullable array field)
      const eventWithRelations = await this.gameEventRepository.findOne({
        where: { id: savedEvent.id },
        relations: [
          'eventType',
          'player',
          'recordedByUser',
          'gameTeam',
          'childEvents',
        ],
      });

      // Publish the timing event so all viewers see it in real-time
      // Skip if caller will publish later (e.g., after linking child events)
      if (eventWithRelations && !skipPublish) {
        await this.publishGameEvent(
          gameId,
          GameEventAction.CREATED,
          eventWithRelations,
        );
      }

      return savedEvent;
    };

    // Get all game teams for substitution events
    const gameTeams = await this.gameTeamRepository.find({
      where: { gameId },
    });

    // Get game details for duration calculation
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['gameFormat'],
    });

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    const totalDuration =
      game.durationMinutes ?? game.format?.durationMinutes ?? 90;

    switch (status) {
      case GameStatus.FIRST_HALF: {
        // Game starting: create GAME_START, then PERIOD_START (period 1) as child
        // Skip publishing GAME_START until after PERIOD_START is linked as child
        const gameStartEvent = await createEvent(
          'GAME_START',
          undefined,
          0,
          0,
          true, // skipPublish - we'll publish after PERIOD_START is created
        );

        // Create PERIOD_START as child of GAME_START
        // Skip publishing until after starters are linked as children
        const periodStartEvent = await createEvent(
          'PERIOD_START',
          { period: '1' },
          0,
          0,
          true, // skipPublish - we'll publish after linking children
          gameStartEvent.id, // parentEventId = GAME_START
        );

        // Link any existing minute 0 SUB_IN events (starters) to PERIOD_START
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.linkFirstHalfStartersToPeriodStart(
            gameTeam.id,
            periodStartEvent.id,
          );
        }

        // Publish GAME_START with PERIOD_START as child
        const gameStartWithChildren = await this.gameEventRepository.findOne({
          where: { id: gameStartEvent.id },
          relations: [
            'eventType',
            'player',
            'recordedByUser',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
            'childEvents.childEvents',
            'childEvents.childEvents.eventType',
            'childEvents.childEvents.player',
          ],
        });
        if (gameStartWithChildren) {
          await this.publishGameEvent(
            gameId,
            GameEventAction.CREATED,
            gameStartWithChildren,
          );
        }

        // Also publish PERIOD_START with its own childEvents (starters)
        const periodStartWithChildren = await this.gameEventRepository.findOne({
          where: { id: periodStartEvent.id },
          relations: [
            'eventType',
            'player',
            'recordedByUser',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
          ],
        });
        if (periodStartWithChildren) {
          await this.publishGameEvent(
            gameId,
            GameEventAction.CREATED,
            periodStartWithChildren,
          );
        }
        break;
      }

      case GameStatus.HALFTIME: {
        // First half ending:
        // Use actual game time from frontend (what the user sees on the clock)
        // This ensures players get credit for actual time played including stoppage
        let halftimeMinute: number;
        let halftimeSecond: number;

        if (providedGameTime) {
          halftimeMinute = providedGameTime.gameMinute;
          halftimeSecond = providedGameTime.gameSecond;
        } else {
          const halftimeSeconds =
            await this.gameTimingService.getGameDurationSeconds(
              gameId,
              totalDuration,
            );
          halftimeMinute = Math.floor(halftimeSeconds / 60);
          halftimeSecond = halftimeSeconds % 60;
        }

        // 1. Create PERIOD_END (period 1) first - will be parent of SUB_OUT events
        // Skip publishing until children are created
        const periodEndEvent = await createEvent(
          'PERIOD_END',
          { period: '1' },
          halftimeMinute,
          halftimeSecond,
          true, // skipPublish
        );

        // 2. Create SUBSTITUTION_OUT for all on-field players as children of PERIOD_END
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.createSubstitutionOutForAllOnField(
            gameTeam.id,
            halftimeMinute,
            halftimeSecond,
            userId!,
            periodEndEvent.id,
            '1', // Period 1 (first half)
          );
        }

        // 3. Now publish PERIOD_END with childEvents included
        const periodEndWithChildren = await this.gameEventRepository.findOne({
          where: { id: periodEndEvent.id },
          relations: [
            'eventType',
            'player',
            'recordedByUser',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
          ],
        });
        if (periodEndWithChildren) {
          await this.publishGameEvent(
            gameId,
            GameEventAction.CREATED,
            periodEndWithChildren,
          );
        }
        break;
      }

      case GameStatus.SECOND_HALF: {
        // Second half starting:
        // Get halftime timing for lineup check
        const timing = await this.gameTimingService.getGameTiming(gameId);
        this.logger.debug(
          `[SECOND_HALF] timing: actualStart=${timing.actualStart}, ` +
            `firstHalfEnd=${timing.firstHalfEnd}, secondHalfStart=${timing.secondHalfStart}`,
        );

        // Use the configured period duration for second half start time
        // This ensures second half always starts at the correct nominal time
        // (e.g., 45:00 for standard 45-minute halves) regardless of when first half actually ended
        const halftimeMinute =
          game.format?.periodDurationMinutes ?? Math.floor(totalDuration / 2);

        this.logger.debug(
          `[SECOND_HALF] halftimeMinute=${halftimeMinute} (totalDuration=${totalDuration})`,
        );

        // 1. Create PERIOD_START (period 2) first - will be parent of SUB_IN events
        // Skip publishing until children are linked/created
        const periodStartEvent = await createEvent(
          'PERIOD_START',
          { period: '2' },
          halftimeMinute,
          0,
          true, // skipPublish
        );

        // 2. Link any orphan SUB_IN events created during halftime to PERIOD_START
        // These are events from bringPlayerOntoField or setSecondHalfLineup called before PERIOD_START existed
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.linkOrphanSubInsToSecondHalfPeriodStart(
            gameId,
            gameTeam.id,
            halftimeMinute,
            periodStartEvent.id,
          );
        }

        // 3. If no second half lineup set, auto-copy first half ending lineup
        // SUB_IN events are created as children of PERIOD_START
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.ensureSecondHalfLineupExists(
            gameTeam.id,
            halftimeMinute,
            userId!,
            periodStartEvent.id,
          );
        }

        // 4. Now publish PERIOD_START with childEvents included
        const periodStartWithChildren = await this.gameEventRepository.findOne({
          where: { id: periodStartEvent.id },
          relations: [
            'eventType',
            'player',
            'recordedByUser',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
          ],
        });
        if (periodStartWithChildren) {
          await this.publishGameEvent(
            gameId,
            GameEventAction.CREATED,
            periodStartWithChildren,
          );
        }
        break;
      }

      case GameStatus.COMPLETED: {
        // Game ending:
        // Use providedGameTime from frontend for consistent timing with displayed timer
        let endMinute: number;
        let endSecond: number;

        if (providedGameTime) {
          // Use the game time directly from frontend (what the user sees)
          endMinute = providedGameTime.gameMinute;
          endSecond = providedGameTime.gameSecond;
        } else {
          // Fallback to calculating from timing events (less accurate)
          const gameSeconds =
            await this.gameTimingService.getGameDurationSeconds(
              gameId,
              totalDuration,
            );
          endMinute = Math.floor(gameSeconds / 60);
          endSecond = gameSeconds % 60;
        }

        // 1. Create GAME_END first - will be parent of PERIOD_END and SUB_OUT events
        // Skip publishing until children are created
        const gameEndEvent = await createEvent(
          'GAME_END',
          undefined,
          endMinute,
          endSecond,
          true, // skipPublish
        );

        // 2. Create PERIOD_END (period 2) as child of GAME_END
        await createEvent(
          'PERIOD_END',
          { period: '2' },
          endMinute,
          endSecond,
          true, // skipPublish - will be published as part of GAME_END's children
          gameEndEvent.id, // parentEventId = GAME_END
        );

        // 3. Create SUBSTITUTION_OUT for all on-field players as children of GAME_END
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.createSubstitutionOutForAllOnField(
            gameTeam.id,
            endMinute,
            endSecond,
            userId!,
            gameEndEvent.id,
            '2', // Period 2 (second half)
          );
        }

        // 4. Now publish GAME_END with childEvents included (PERIOD_END + SUB_OUTs)
        const gameEndWithChildren = await this.gameEventRepository.findOne({
          where: { id: gameEndEvent.id },
          relations: [
            'eventType',
            'player',
            'recordedByUser',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
          ],
        });
        if (gameEndWithChildren) {
          await this.publishGameEvent(
            gameId,
            GameEventAction.CREATED,
            gameEndWithChildren,
          );
        }
        break;
      }
    }
  }

  /**
   * Creates stoppage events for pause/resume functionality.
   * pausedAt = Date means pause (create STOPPAGE_START)
   * pausedAt = null means resume (create STOPPAGE_END)
   *
   * @throws Error if required event type is not found in the database
   * @throws Error if userId is not provided
   */
  private async handlePauseResumeEvent(
    gameId: string,
    pausedAt: Date | null,
    userId?: string,
  ): Promise<void> {
    if (!userId) {
      throw new Error(
        `Cannot ${pausedAt ? 'pause' : 'resume'} game: userId is required`,
      );
    }

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

  /**
   * Reopens a completed game by deleting the GAME_END event and its children,
   * then setting the status back to SECOND_HALF.
   *
   * This allows adding missed events (goals, substitutions) to a game that was
   * accidentally completed too early.
   *
   * @param id - The ID of the game to reopen
   * @returns The updated game with status SECOND_HALF
   * @throws NotFoundException if game not found
   * @throws Error if game is not in COMPLETED status
   */
  async reopenGame(id: string): Promise<Game> {
    const game = await this.findOne(id);

    if (game.status !== GameStatus.COMPLETED) {
      throw new Error(
        `Cannot reopen game: game is in ${game.status} status, not COMPLETED`,
      );
    }

    // Find the GAME_END event for this game
    const gameEndEventType = await this.eventTypeRepository.findOne({
      where: { name: 'GAME_END' },
    });

    if (!gameEndEventType) {
      throw new Error('GAME_END event type not found in database');
    }

    const gameEndEvent = await this.gameEventRepository.findOne({
      where: {
        gameId: id,
        eventTypeId: gameEndEventType.id,
      },
      relations: ['childEvents', 'childEvents.eventType', 'childEvents.player'],
    });

    if (gameEndEvent) {
      // Publish deletion event before deleting
      await this.publishGameEvent(id, GameEventAction.DELETED, gameEndEvent);

      // Delete GAME_END - children (PERIOD_END, SUBSTITUTION_OUT) cascade automatically
      await this.gameEventRepository.remove(gameEndEvent);

      this.logger.log(
        `Deleted GAME_END event ${gameEndEvent.id} and ${gameEndEvent.childEvents?.length ?? 0} child events for game ${id}`,
      );
    }

    // Update game status to SECOND_HALF and clear actualEnd
    await this.gameRepository
      .createQueryBuilder()
      .update(Game)
      .set({
        status: GameStatus.SECOND_HALF,
        actualEnd: () => 'NULL',
      })
      .where('id = :id', { id })
      .execute();

    this.logger.log(`Reopened game ${id} - status changed to SECOND_HALF`);

    return this.findOne(id);
  }

  /**
   * Publish a game event change to all subscribers.
   * Used for timing events (GAME_START, PERIOD_START, etc.) created by GamesService.
   */
  private async publishGameEvent(
    gameId: string,
    action: GameEventAction,
    event: GameEvent,
  ): Promise<void> {
    const payload: GameEventSubscriptionPayload = {
      action,
      gameId,
      event,
    };

    await this.pubSub.publish(`gameEvent:${gameId}`, {
      gameEventChanged: payload,
    });
  }
}
