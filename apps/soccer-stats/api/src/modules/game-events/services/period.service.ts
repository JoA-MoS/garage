import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
  Logger,
} from '@nestjs/common';
import { In, IsNull, MoreThanOrEqual } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { Game, GameStatus } from '../../../entities/game.entity';
import { GameTimingService } from '../../games/game-timing.service';
import { SetSecondHalfLineupInput } from '../dto/set-second-half-lineup.input';
import { SecondHalfLineupResult } from '../dto/set-second-half-lineup.output';
import { StartPeriodInput } from '../dto/start-period.input';
import { EndPeriodInput } from '../dto/end-period.input';
import { PeriodResult } from '../dto/period-result.output';
import { GameEventAction } from '../dto/game-event-subscription.output';

import { EventCoreService } from './event-core.service';
import { LineupService } from './lineup.service';

/**
 * Service responsible for period and halftime management.
 * Handles period start/end events and second half lineup management.
 */
@Injectable()
export class PeriodService {
  private readonly logger = new Logger(PeriodService.name);

  constructor(
    private readonly coreService: EventCoreService,
    @Inject(forwardRef(() => LineupService))
    private readonly lineupService: LineupService,
    private readonly gameTimingService: GameTimingService,
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  /**
   * Start a period by creating PERIOD_START event and SUB_IN events for the lineup.
   * SUB_IN events are created as children of the PERIOD_START event.
   *
   * @param input - Period start input with lineup
   * @param recordedByUserId - User recording the events
   * @returns PeriodResult with created events
   */
  async startPeriod(
    input: StartPeriodInput,
    recordedByUserId: string,
  ): Promise<PeriodResult> {
    // 1. Validate game team exists and get game
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: input.gameTeamId },
      relations: ['game', 'game.gameFormat'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${input.gameTeamId} not found`);
    }

    const game = gameTeam.game;

    // 2. Validate each lineup player has either playerId OR externalPlayerName
    for (const player of input.lineup) {
      this.coreService.ensurePlayerInfoProvided(
        player.playerId,
        player.externalPlayerName,
        'period lineup entry',
      );
    }

    // 3. Determine game time for period start
    const gameMinute =
      input.gameMinute ??
      (input.period === 1 ? 0 : await this.calculateHalftimeMinute(game));
    const gameSecond = input.gameSecond ?? 0;

    // 4. Get event types
    const periodStartType = this.coreService.getEventTypeByName('PERIOD_START');
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // 5. Create PERIOD_START event
    const periodEvent = this.gameEventsRepository.create({
      gameId: game.id,
      gameTeamId: input.gameTeamId,
      eventTypeId: periodStartType.id,
      recordedByUserId,
      gameMinute,
      gameSecond,
      metadata: { period: String(input.period) },
    });

    const savedPeriodEvent = await this.gameEventsRepository.save(periodEvent);

    // 6. Create SUB_IN events as children of PERIOD_START
    const substitutionEvents: GameEvent[] = [];
    const periodString = String(input.period);

    for (const player of input.lineup) {
      const subInEvent = this.gameEventsRepository.create({
        gameId: game.id,
        gameTeamId: input.gameTeamId,
        eventTypeId: subInType.id,
        playerId: player.playerId,
        externalPlayerName: player.externalPlayerName,
        externalPlayerNumber: player.externalPlayerNumber,
        position: player.position,
        recordedByUserId,
        gameMinute,
        gameSecond,
        parentEventId: savedPeriodEvent.id,
        period: periodString,
      });

      const savedSubIn = await this.gameEventsRepository.save(subInEvent);
      substitutionEvents.push(savedSubIn);
    }

    // 7. Load relations for period event
    const periodEventWithRelations = await this.gameEventsRepository.findOne({
      where: { id: savedPeriodEvent.id },
      relations: [
        'eventType',
        'recordedByUser',
        'gameTeam',
        'game',
        'childEvents',
        'childEvents.eventType',
        'childEvents.player',
      ],
    });

    // 8. Reload substitution events with relations
    const substitutionEventIds = substitutionEvents.map((e) => e.id);
    const substitutionEventsWithRelations =
      substitutionEventIds.length > 0
        ? await this.gameEventsRepository.find({
            where: { id: In(substitutionEventIds) },
            relations: ['eventType', 'player'],
          })
        : [];

    // 9. Publish events
    await this.coreService.publishGameEvent(
      game.id,
      GameEventAction.CREATED,
      periodEventWithRelations!,
    );

    return {
      periodEvent: periodEventWithRelations!,
      substitutionEvents: substitutionEventsWithRelations,
      period: input.period,
      substitutionCount: substitutionEventsWithRelations.length,
    };
  }

  /**
   * End a period by creating PERIOD_END event and SUB_OUT events for all on-field players.
   * Queries the current lineup from the database to determine who needs to be subbed out.
   * SUB_OUT events are created as children of the PERIOD_END event.
   *
   * @param input - Period end input
   * @param recordedByUserId - User recording the events
   * @returns PeriodResult with created events
   */
  async endPeriod(
    input: EndPeriodInput,
    recordedByUserId: string,
  ): Promise<PeriodResult> {
    // 1. Validate game team exists and get game
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: input.gameTeamId },
      relations: ['game', 'game.gameFormat'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${input.gameTeamId} not found`);
    }

    const game = gameTeam.game;

    // 2. Determine game time for period end
    const totalDuration =
      game.durationMinutes ?? game.gameFormat?.durationMinutes ?? 90;
    const elapsedSeconds = await this.gameTimingService.getGameDurationSeconds(
      game.id,
      totalDuration,
    );

    const gameMinute = input.gameMinute ?? Math.floor(elapsedSeconds / 60);
    const gameSecond = input.gameSecond ?? elapsedSeconds % 60;

    // 3. Get event types
    const periodEndType = this.coreService.getEventTypeByName('PERIOD_END');
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

    // 4. Create PERIOD_END event first
    const periodEvent = this.gameEventsRepository.create({
      gameId: game.id,
      gameTeamId: input.gameTeamId,
      eventTypeId: periodEndType.id,
      recordedByUserId,
      gameMinute,
      gameSecond,
      metadata: { period: String(input.period) },
    });

    const savedPeriodEvent = await this.gameEventsRepository.save(periodEvent);

    // 5. Get current lineup from database
    const lineup = await this.lineupService.getGameLineup(input.gameTeamId);

    // 6. Create SUB_OUT events for all on-field players as children of PERIOD_END
    const substitutionEvents: GameEvent[] = [];

    for (const player of lineup.currentOnField) {
      const subOutEvent = this.gameEventsRepository.create({
        gameId: game.id,
        gameTeamId: input.gameTeamId,
        eventTypeId: subOutType.id,
        playerId: player.playerId,
        externalPlayerName: player.externalPlayerName,
        externalPlayerNumber: player.externalPlayerNumber,
        position: player.position,
        recordedByUserId,
        gameMinute,
        gameSecond,
        parentEventId: savedPeriodEvent.id,
      });

      const savedSubOut = await this.gameEventsRepository.save(subOutEvent);
      substitutionEvents.push(savedSubOut);
    }

    // 7. Load relations for period event
    const periodEventWithRelations = await this.gameEventsRepository.findOne({
      where: { id: savedPeriodEvent.id },
      relations: [
        'eventType',
        'recordedByUser',
        'gameTeam',
        'game',
        'childEvents',
        'childEvents.eventType',
        'childEvents.player',
      ],
    });

    // 8. Reload substitution events with relations
    const substitutionEventIds = substitutionEvents.map((e) => e.id);
    const substitutionEventsWithRelations =
      substitutionEventIds.length > 0
        ? await this.gameEventsRepository.find({
            where: { id: In(substitutionEventIds) },
            relations: ['eventType', 'player'],
          })
        : [];

    // 9. Publish events
    await this.coreService.publishGameEvent(
      game.id,
      GameEventAction.CREATED,
      periodEventWithRelations!,
    );

    return {
      periodEvent: periodEventWithRelations!,
      substitutionEvents: substitutionEventsWithRelations,
      period: input.period,
      substitutionCount: substitutionEventsWithRelations.length,
    };
  }

  /**
   * Set the second half lineup during halftime.
   *
   * Since SUBSTITUTION_OUT events are now created automatically during the HALFTIME
   * transition, this method only creates SUBSTITUTION_IN events for the new lineup.
   *
   * If the coach wants the same lineup for the second half, they don't need to call this -
   * the ensureSecondHalfLineupExists() method will auto-copy the lineup when the second
   * half starts.
   *
   * Uses the actual elapsed game time from the timing service, which accounts for
   * games that ran longer or shorter than the scheduled half duration.
   */
  async setSecondHalfLineup(
    input: SetSecondHalfLineupInput,
    recordedByUserId: string,
  ): Promise<SecondHalfLineupResult> {
    // 1. Validate game team exists and get game
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: input.gameTeamId },
      relations: ['game', 'game.gameFormat'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${input.gameTeamId} not found`);
    }

    const game = gameTeam.game;

    // 2. Validate game is in HALFTIME status
    if (game.status !== GameStatus.HALFTIME) {
      throw new BadRequestException(
        `Cannot set second half lineup: game is in ${game.status} status, expected HALFTIME`,
      );
    }

    // 3. Validate each lineup player has either playerId OR externalPlayerName
    for (const player of input.lineup) {
      this.coreService.ensurePlayerInfoProvided(
        player.playerId,
        player.externalPlayerName,
        'second half lineup entry',
      );
    }

    // 4. Get actual game clock time at halftime (when first half ended)
    const totalDuration =
      game.durationMinutes ?? game.gameFormat?.durationMinutes ?? 90;
    const actualHalftimeSeconds =
      await this.gameTimingService.getGameDurationSeconds(
        game.id,
        totalDuration,
      );
    const halftimeMinute = Math.floor(actualHalftimeSeconds / 60);
    const halftimeSecond = actualHalftimeSeconds % 60;

    // 5. Get SUBSTITUTION_IN event type
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // 6. Clear any existing second half SUB_IN events
    // (in case coach is changing their mind about the lineup)
    await this.clearSecondHalfLineup(input.gameTeamId, halftimeMinute);

    const allEvents: GameEvent[] = [];

    // 7. Create SUBSTITUTION_IN events for each player in the new lineup
    // Uses actual halftime clock (players enter at the halftime moment)
    // Note: SUB_OUT events were created automatically when game transitioned to HALFTIME
    for (const player of input.lineup) {
      const subInEvent = this.gameEventsRepository.create({
        gameId: game.id,
        gameTeamId: input.gameTeamId,
        eventTypeId: subInType.id,
        playerId: player.playerId,
        externalPlayerName: player.externalPlayerName,
        externalPlayerNumber: player.externalPlayerNumber,
        recordedByUserId,
        gameMinute: halftimeMinute,
        gameSecond: halftimeSecond,
        position: player.position,
        period: '2', // Second half
      });

      const savedSubIn = await this.gameEventsRepository.save(subInEvent);
      allEvents.push(savedSubIn);
    }

    // 8. Load relations for all created events
    const eventsWithRelations = await this.gameEventsRepository.find({
      where: allEvents.map((e) => ({ id: e.id })),
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

    // 9. Publish events to subscribers (batch notification)
    for (const event of eventsWithRelations) {
      await this.coreService.publishGameEvent(
        game.id,
        GameEventAction.CREATED,
        event,
      );
    }

    // Note: substitutionsOut is 0 because SUB_OUT events are now created
    // automatically during HALFTIME transition, not in this method
    return {
      events: eventsWithRelations,
      substitutionsOut: 0,
      substitutionsIn: input.lineup.length,
    };
  }

  /**
   * Clear any existing second half lineup (SUB_IN events at or after halftime).
   * Used when coach wants to change their mind about the second half lineup.
   */
  private async clearSecondHalfLineup(
    gameTeamId: string,
    halftimeMinute: number,
  ): Promise<void> {
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Find and delete existing SUB_IN events at halftime or later
    const existingSubIns = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: subInType.id,
      },
    });

    // Only delete SUB_IN events at or after halftime (second half lineup)
    // Keep SUB_IN events from earlier (first half substitutions)
    const secondHalfSubIns = existingSubIns.filter(
      (event) => event.gameMinute >= halftimeMinute,
    );

    if (secondHalfSubIns.length > 0) {
      await this.gameEventsRepository.remove(secondHalfSubIns);
    }
  }

  /**
   * Calculate the halftime minute based on game timing.
   * Used when starting period 2 without explicit gameMinute.
   */
  private async calculateHalftimeMinute(game: Game): Promise<number> {
    const totalDuration =
      game.durationMinutes ?? game.gameFormat?.durationMinutes ?? 90;
    const timing = await this.gameTimingService.getGameTiming(game.id);

    if (timing.firstHalfEnd && timing.actualStart) {
      return Math.floor(
        (timing.firstHalfEnd.getTime() - timing.actualStart.getTime()) / 60000,
      );
    }

    // Fallback: use half of total duration
    return Math.floor(totalDuration / 2);
  }

  /**
   * Ensure second half lineup exists by copying first half ending lineup if needed.
   * Called when transitioning to SECOND_HALF without explicit setSecondHalfLineup call.
   *
   * The logic: Players were SUB_OUT at halftime. We need to SUB_IN the same players
   * (with their positions) for the second half unless coach explicitly changed lineup.
   *
   * @param gameTeamId - The game team ID
   * @param halftimeMinute - Game minute at halftime (when players were subbed out)
   * @param recordedByUserId - User recording the events
   * @param parentEventId - Optional parent event ID (PERIOD_START) to link SUB_IN events as children
   */
  async ensureSecondHalfLineupExists(
    gameTeamId: string,
    halftimeMinute: number,
    recordedByUserId: string,
    parentEventId?: string,
  ): Promise<void> {
    this.logger.log(
      `[ensureSecondHalfLineupExists] gameTeamId=${gameTeamId}, halftimeMinute=${halftimeMinute}`,
    );

    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    // Find the PERIOD_START (period='2') event to check if second half lineup already exists
    const periodStartType = this.coreService.getEventTypeByName('PERIOD_START');
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Find PERIOD_START events for period 2
    const periodStartEvents = await this.gameEventsRepository.find({
      where: {
        gameId: gameTeam.gameId,
        eventTypeId: periodStartType.id,
      },
    });

    const periodStart2 = periodStartEvents.find((e) => {
      const metadata = e.metadata as { period?: string } | undefined;
      return metadata?.period === '2';
    });

    this.logger.log(
      `[ensureSecondHalfLineupExists] Found PERIOD_START period 2: ${periodStart2?.id ?? 'none'}`,
    );

    // Check if SUB_IN events already exist as children of PERIOD_START period 2
    // This is more robust than checking gameMinute, which fails for short games
    if (periodStart2) {
      const existingSecondHalfSubIns = await this.gameEventsRepository.find({
        where: {
          gameTeamId,
          eventTypeId: subInType.id,
          parentEventId: periodStart2.id,
        },
      });

      this.logger.log(
        `[ensureSecondHalfLineupExists] Found ${existingSecondHalfSubIns.length} existing SUB_IN events linked to PERIOD_START period 2`,
      );

      if (existingSecondHalfSubIns.length > 0) {
        // Second half lineup already exists (from setSecondHalfLineup)
        this.logger.log(
          `[ensureSecondHalfLineupExists] Second half lineup already set, skipping`,
        );
        return;
      }
    }

    // Find the PERIOD_END (period='1') event first, then get its child SUB_OUT events
    // This is more robust than matching by gameMinute, which can be affected by timing calculations
    const periodEndType = this.coreService.getEventTypeByName('PERIOD_END');
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

    // Find the PERIOD_END event for period 1 (halftime)
    const periodEndEvent = await this.gameEventsRepository.findOne({
      where: {
        gameId: gameTeam.gameId,
        eventTypeId: periodEndType.id,
      },
      order: { createdAt: 'DESC' },
    });

    if (!periodEndEvent) {
      this.logger.log(
        `[ensureSecondHalfLineupExists] No PERIOD_END event found for game ${gameTeam.gameId}`,
      );
      return;
    }

    // Check if this is period 1's end by looking at metadata
    const periodMetadata = periodEndEvent.metadata as
      | { period?: string }
      | undefined;
    if (periodMetadata?.period !== '1') {
      this.logger.log(
        `[ensureSecondHalfLineupExists] PERIOD_END event is for period ${periodMetadata?.period}, not period 1`,
      );
      return;
    }

    this.logger.log(
      `[ensureSecondHalfLineupExists] Found PERIOD_END event: id=${periodEndEvent.id}, gameMinute=${periodEndEvent.gameMinute}`,
    );

    // Find SUB_OUT events that are children of the PERIOD_END event (halftime subs)
    const halftimeSubOuts = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: subOutType.id,
        parentEventId: periodEndEvent.id,
      },
    });

    this.logger.log(
      `[ensureSecondHalfLineupExists] Found ${halftimeSubOuts.length} SUB_OUT events as children of PERIOD_END`,
    );

    // Create SUB_IN events for each player who was subbed out at halftime
    // This effectively "brings them back" for the second half
    // Use the gameMinute from the PERIOD_END event for consistency
    const actualHalftimeMinute = periodEndEvent.gameMinute;

    for (const subOut of halftimeSubOuts) {
      const subInEvent = this.gameEventsRepository.create({
        gameId: gameTeam.gameId,
        gameTeamId,
        eventTypeId: subInType.id,
        playerId: subOut.playerId,
        externalPlayerName: subOut.externalPlayerName,
        externalPlayerNumber: subOut.externalPlayerNumber,
        position: subOut.position, // Preserve their position from first half
        recordedByUserId,
        gameMinute: actualHalftimeMinute,
        gameSecond: 0, // Second half starts at the next second
        parentEventId,
        period: '2', // Second half
      });

      await this.gameEventsRepository.save(subInEvent);
    }
  }

  /**
   * Link orphan SUB_IN events (created during halftime via bringPlayerOntoField)
   * to the PERIOD_START period=2 event.
   *
   * Called when transitioning to SECOND_HALF to ensure all second-half SUB_IN events
   * have proper parentEventId linkage.
   *
   * @param gameId - The game ID
   * @param gameTeamId - The game team ID
   * @param halftimeMinute - The game minute when halftime occurred
   * @param periodStartEventId - The PERIOD_START period=2 event ID
   */
  async linkOrphanSubInsToSecondHalfPeriodStart(
    _gameId: string,
    gameTeamId: string,
    halftimeMinute: number,
    periodStartEventId: string,
  ): Promise<number> {
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Find SUB_IN events that:
    // 1. Belong to this game team
    // 2. Are at or after halftime (second half starters)
    // 3. Have NO parentEventId (orphan events from bringPlayerOntoField or setSecondHalfLineup)
    const orphanSubIns = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: subInType.id,
        parentEventId: IsNull(),
        gameMinute: MoreThanOrEqual(halftimeMinute),
      },
    });

    this.logger.log(
      `[linkOrphanSubInsToSecondHalfPeriodStart] Found ${orphanSubIns.length} orphan SUB_IN events for gameTeam ${gameTeamId}`,
    );

    if (orphanSubIns.length === 0) {
      return 0;
    }

    // Update all orphan events to link to the PERIOD_START
    for (const event of orphanSubIns) {
      event.parentEventId = periodStartEventId;
    }

    await this.gameEventsRepository.save(orphanSubIns);

    this.logger.log(
      `[linkOrphanSubInsToSecondHalfPeriodStart] Linked ${orphanSubIns.length} orphan SUB_IN events to PERIOD_START ${periodStartEventId}`,
    );

    return orphanSubIns.length;
  }

  /**
   * Link first half starters (minute 0 SUB_IN events without parent) to the PERIOD_START period=1 event.
   *
   * Called when transitioning to FIRST_HALF to ensure all starter SUB_IN events
   * have proper parentEventId linkage for display in the Events tab.
   *
   * @param gameTeamId - The game team ID
   * @param periodStartEventId - The PERIOD_START period=1 event ID
   */
  async linkFirstHalfStartersToPeriodStart(
    gameTeamId: string,
    periodStartEventId: string,
  ): Promise<number> {
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Find SUB_IN events that:
    // 1. Belong to this game team
    // 2. Are at minute 0 (starters)
    // 3. Have NO parentEventId (orphan events)
    const starterSubIns = await this.gameEventsRepository.find({
      where: {
        gameTeamId,
        eventTypeId: subInType.id,
        parentEventId: IsNull(),
        gameMinute: 0,
        gameSecond: 0,
      },
    });

    this.logger.log(
      `[linkFirstHalfStartersToPeriodStart] Found ${starterSubIns.length} starter SUB_IN events for gameTeam ${gameTeamId}`,
    );

    if (starterSubIns.length === 0) {
      return 0;
    }

    // Update all starter events to link to the PERIOD_START
    for (const event of starterSubIns) {
      event.parentEventId = periodStartEventId;
    }

    await this.gameEventsRepository.save(starterSubIns);

    this.logger.log(
      `[linkFirstHalfStartersToPeriodStart] Linked ${starterSubIns.length} starter SUB_IN events to PERIOD_START ${periodStartEventId}`,
    );

    return starterSubIns.length;
  }
}
