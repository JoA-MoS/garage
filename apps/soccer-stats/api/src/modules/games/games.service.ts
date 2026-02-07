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
      periodSecond: _periodSecond,
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
    // Pass period-relative time from frontend for consistent timing with displayed timer
    await this.createTimingEventsForStatusChange(
      id,
      updateGameInput.status,
      userId,
      updateGameInput.periodSecond,
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
   *
   * Returns the base entity without eager-loaded relations.
   * GraphQL field resolvers + DataLoaders handle relation loading on-demand.
   *
   * @see game-team.resolver.ts for field resolvers
   */
  async updateGameTeam(
    gameTeamId: string,
    updateGameTeamInput: UpdateGameTeamInput,
  ): Promise<GameTeam> {
    const gameTeam = await this.gameTeamRepository.findOne({
      where: { id: gameTeamId },
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

    // Save and return - field resolvers handle any requested relations
    return this.gameTeamRepository.save(gameTeam);
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
      .leftJoinAndSelect('game.teams', 'gameTeams')
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
   * Creates timing events based on game status changes.
   * This replaces direct column updates with event-based timing.
   *
   * @param providedPeriodSecond - Optional period-relative seconds from frontend for the status change.
   *                              Used to ensure consistent timing between frontend timer and events.
   * @throws Error if required event types are not found in the database
   * @throws Error if userId is not provided for status changes that create timing events
   */
  private async createTimingEventsForStatusChange(
    gameId: string,
    status?: GameStatus,
    userId?: string,
    providedPeriodSecond?: number,
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

    const requiredEventTypes = ['PERIOD_START', 'PERIOD_END'];

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
      period: string | undefined,
      periodSecond: number,
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
      // For period events, also check period column matches
      const existingEventQuery = this.gameEventRepository
        .createQueryBuilder('event')
        .where('event.gameId = :gameId', { gameId })
        .andWhere('event.eventTypeId = :eventTypeId', {
          eventTypeId: eventType.id,
        });

      // For PERIOD_START/PERIOD_END, check the specific period
      if (period) {
        existingEventQuery.andWhere('event.period = :period', { period });
      }

      const existingEvent = await existingEventQuery.getOne();
      if (existingEvent) {
        // PERIOD_START events must always have periodSecond: 0
        if (
          eventTypeName === 'PERIOD_START' &&
          existingEvent.periodSecond !== 0
        ) {
          this.logger.warn(
            `[createEvent] Existing PERIOD_START for period ${period} has periodSecond: ${existingEvent.periodSecond}, correcting to 0`,
          );
          existingEvent.periodSecond = 0;
          await this.gameEventRepository.save(existingEvent);
        }

        this.logger.debug(
          `Skipping duplicate ${eventTypeName} event for game ${gameId}` +
            (period ? ` (period ${period})` : ''),
        );
        return existingEvent;
      }

      const event = this.gameEventRepository.create({
        gameId,
        gameTeamId: homeGameTeam.id,
        eventTypeId: eventType.id,
        recordedByUserId: userId,
        period,
        periodSecond,
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
      relations: ['format'],
    });

    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    const totalDuration =
      game.durationMinutes ?? game.format?.durationMinutes ?? 90;

    switch (status) {
      case GameStatus.FIRST_HALF: {
        // Game starting: create PERIOD_START (period 1) - no GAME_START wrapper
        // PERIOD_START (period=1) serves as the game start indicator
        // Skip publishing until after starters are linked as children
        const periodStartEvent = await createEvent(
          'PERIOD_START',
          '1', // period 1 (first half)
          0, // periodSecond — period starts at 0
          true, // skipPublish - we'll publish after linking children
        );

        // Link any existing minute 0 SUB_IN events (starters) to PERIOD_START
        // If none exist (new roster flow), create SUB_IN from GAME_ROSTER starters
        for (const gameTeam of gameTeams) {
          const linkedCount =
            await this.gameEventsService.linkFirstHalfStartersToPeriodStart(
              gameTeam.id,
              periodStartEvent.id,
            );

          // If no existing SUB_IN events were linked, create from GAME_ROSTER starters
          if (linkedCount === 0) {
            await this.gameEventsService.createSubInEventsFromRosterStarters(
              gameTeam.id,
              periodStartEvent.id,
              userId!,
            );
          }
        }

        // Publish PERIOD_START with its childEvents (starters)
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
        // Frontend sends period-relative time for period 1
        let halftimePeriodSecond: number;

        if (providedPeriodSecond !== undefined) {
          halftimePeriodSecond = providedPeriodSecond;
        } else {
          halftimePeriodSecond =
            await this.gameTimingService.getGameDurationSeconds(
              gameId,
              totalDuration,
            );
        }

        // 1. Create PERIOD_END (period 1) first - will be parent of SUB_OUT events
        // Skip publishing until children are created
        const periodEndEvent = await createEvent(
          'PERIOD_END',
          '1', // period 1 (first half)
          halftimePeriodSecond,
          true, // skipPublish
        );

        // 2. Create SUBSTITUTION_OUT for all on-field players as children of PERIOD_END
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.createSubstitutionOutForAllOnField(
            gameTeam.id,
            '1', // Period 1 (first half)
            halftimePeriodSecond,
            userId!,
            periodEndEvent.id,
          );

          // 2b. Create GAME_ROSTER events for period 2 to pre-populate halftime lineup
          // Uses SUBSTITUTION_OUT children of PERIOD_END to get players who were on field
          await this.gameEventsService.createGameRosterForNextPeriod(
            gameTeam.id,
            '2', // Next period
            userId!,
            periodEndEvent.id,
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
          '2', // period 2 (second half)
          0, // periodSecond — period starts at 0
          true, // skipPublish
        );

        // 2. Link orphan SUB_INs and/or create from GAME_ROSTER per team
        // If linkOrphan finds events (coach set explicit halftime lineup), skip GAME_ROSTER conversion
        // to avoid duplicates. Otherwise, fall through to GAME_ROSTER → SUB_IN conversion.
        for (const gameTeam of gameTeams) {
          const linked =
            await this.gameEventsService.linkOrphanSubInsToSecondHalfPeriodStart(
              gameId,
              gameTeam.id,
              halftimeMinute,
              periodStartEvent.id,
            );

          if (linked > 0) {
            // Coach's explicit halftime lineup takes priority — skip GAME_ROSTER conversion
            this.logger.debug(
              `[SECOND_HALF] Linked ${linked} orphan SUB_INs for gameTeam ${gameTeam.id}, ` +
                `skipping GAME_ROSTER conversion`,
            );
            continue;
          }

          // No orphan SUB_INs — convert GAME_ROSTER events to SUB_IN events
          const created =
            await this.gameEventsService.createSubInEventsFromRosterStarters(
              gameTeam.id,
              periodStartEvent.id,
              userId!,
              '2', // period 2 (second half)
            );

          // Fallback: If no GAME_ROSTER events were converted (legacy games or failed halftime),
          // use the old method that copies from SUB_OUT events
          if (created === 0) {
            this.logger.warn(
              `[SECOND_HALF] No GAME_ROSTER events found for period 2, gameTeam ${gameTeam.id}. ` +
                `Falling back to legacy ensureSecondHalfLineupExists. ` +
                `This may indicate GAME_ROSTER creation failed at halftime.`,
            );
            await this.gameEventsService.ensureSecondHalfLineupExists(
              gameTeam.id,
              halftimeMinute,
              userId!,
              periodStartEvent.id,
            );
          }
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
        // Determine final period from game format (e.g., 2 for halves, 4 for quarters)
        const numberOfPeriods = game.format?.numberOfPeriods ?? 2;
        const finalPeriod = String(numberOfPeriods);

        // Calculate period-relative seconds for the final period
        // Frontend sends period-relative time directly
        let endPeriodSeconds: number;
        if (providedPeriodSecond !== undefined) {
          endPeriodSeconds = providedPeriodSecond;
        } else {
          // Fallback: compute from timer service (returns absolute), convert to period-relative
          const periodDurationSeconds =
            (game.format?.periodDurationMinutes ??
              Math.floor(totalDuration / numberOfPeriods)) * 60;
          const previousPeriodsSeconds =
            periodDurationSeconds * (numberOfPeriods - 1);
          const endAbsoluteSeconds =
            await this.gameTimingService.getGameDurationSeconds(
              gameId,
              totalDuration,
            );
          endPeriodSeconds = Math.max(
            0,
            endAbsoluteSeconds - previousPeriodsSeconds,
          );
        }

        // 1. Create PERIOD_END for final period - no GAME_END wrapper
        // PERIOD_END (final period) serves as the game end indicator
        // Skip publishing until children are created
        const periodEndEvent = await createEvent(
          'PERIOD_END',
          finalPeriod,
          endPeriodSeconds, // period-relative time
          true, // skipPublish
        );

        // 2. Create SUBSTITUTION_OUT for all on-field players as children of PERIOD_END
        for (const gameTeam of gameTeams) {
          await this.gameEventsService.createSubstitutionOutForAllOnField(
            gameTeam.id,
            finalPeriod,
            endPeriodSeconds,
            userId!,
            periodEndEvent.id,
          );
        }

        // 3. Publish PERIOD_END with childEvents (SUB_OUTs)
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
      // Stoppage events don't belong to a specific period
      periodSecond: 0,
    });
    await this.gameEventRepository.save(event);
  }

  /**
   * Reopens a completed game by deleting the final PERIOD_END event and its children,
   * then setting the status back to the final period (e.g., SECOND_HALF).
   *
   * This allows adding missed events (goals, substitutions) to a game that was
   * accidentally completed too early.
   *
   * @param id - The ID of the game to reopen
   * @returns The updated game with status set to the final period
   * @throws NotFoundException if game not found
   * @throws Error if game is not in COMPLETED status
   */
  async reopenGame(id: string): Promise<Game> {
    // Load game with format to determine final period
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: ['format'],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    if (game.status !== GameStatus.COMPLETED) {
      throw new Error(
        `Cannot reopen game: game is in ${game.status} status, not COMPLETED`,
      );
    }

    // Determine final period from game format
    const numberOfPeriods = game.format?.numberOfPeriods ?? 2;
    const finalPeriod = String(numberOfPeriods);

    // Find the PERIOD_END event for the final period
    const periodEndEventType = await this.eventTypeRepository.findOne({
      where: { name: 'PERIOD_END' },
    });

    if (!periodEndEventType) {
      throw new Error('PERIOD_END event type not found in database');
    }

    const periodEndEvent = await this.gameEventRepository.findOne({
      where: {
        gameId: id,
        eventTypeId: periodEndEventType.id,
        period: finalPeriod,
      },
      relations: ['childEvents', 'childEvents.eventType', 'childEvents.player'],
    });

    if (periodEndEvent) {
      // Publish deletion event before deleting
      await this.publishGameEvent(id, GameEventAction.DELETED, periodEndEvent);

      // Delete PERIOD_END - children (SUBSTITUTION_OUT) cascade automatically
      await this.gameEventRepository.remove(periodEndEvent);

      this.logger.log(
        `Deleted PERIOD_END event ${periodEndEvent.id} (period ${finalPeriod}) and ${periodEndEvent.childEvents?.length ?? 0} child events for game ${id}`,
      );
    }

    // Update game status back to the final period status and clear actualEnd
    // For 2 periods (halves): SECOND_HALF, for 4 periods: would be FOURTH_QUARTER, etc.
    // Currently only halves are supported, so we use SECOND_HALF
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
   * Used for timing events (PERIOD_START, PERIOD_END, etc.) created by GamesService.
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
