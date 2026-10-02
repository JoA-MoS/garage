import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Repository } from 'typeorm';

import { GameEvent } from '../../../entities/game-event.entity';
import { GameTeam } from '../../../entities/game-team.entity';
import {
  StatsFeatures,
  DEFAULT_STATS_FEATURES,
} from '../../../entities/stats-features.type';
import { SubstitutePlayerInput } from '../dto/substitute-player.input';
import { BringPlayerOntoFieldInput } from '../dto/bring-player-onto-field.input';
import { RemovePlayerFromFieldInput } from '../dto/remove-player-from-field.input';
import {
  BatchLineupChangesInput,
  BatchSwapPlayerRef,
} from '../dto/batch-lineup-changes.input';
import { SwapPositionsInput } from '../dto/swap-positions.input';
import { GameEventAction } from '../dto/game-event-subscription.output';
import {
  assertClientUuid,
  resolveOccurredAt,
} from '../utils/client-action.util';

import { EventCoreService } from './event-core.service';
import { LineupService } from './lineup.service';
import { ActionReceiptService } from './action-receipt.service';

/**
 * Sentinel position stored on a SUBSTITUTION_IN event when the team has
 * position tracking disabled. On-field status is derived elsewhere (e.g.
 * LineupService.getGameRoster) from `position != null`, so a subbed-in
 * player still needs a non-null position even though no real position code
 * applies. Must match the frontend's FIELD_SENTINEL_POSITION
 * (lineup-panel/types.ts), which uses this same convention for pre-game and
 * halftime field placements.
 */
const NON_TRACKED_FIELD_POSITION = 'FIELD';

/** Shared context for writing one action's events inside its transaction. */
export interface ActionWriteContext {
  /** Repository bound to the action's transaction. */
  events: Repository<GameEvent>;
  gameId: string;
  recordedByUserId: string;
  occurredAt?: Date;
}

export type ApplySwapFn = (
  ctx: ActionWriteContext,
  input: SwapPositionsInput,
) => Promise<GameEvent[]>;

/**
 * Service responsible for substitution operations.
 * Handles player substitutions, field entries/exits, and batch changes.
 */
@Injectable()
export class SubstitutionService {
  constructor(
    private readonly coreService: EventCoreService,
    @Inject(forwardRef(() => LineupService))
    private readonly lineupService: LineupService,
    private readonly receipts: ActionReceiptService,
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  /**
   * Resolve the effective stats features for a game team.
   * Cascade: gameTeam.statsFeatures → game.statsFeatures → DEFAULT_STATS_FEATURES
   */
  private async getEffectiveFeatures(
    gameTeam: GameTeam,
  ): Promise<StatsFeatures> {
    if (gameTeam.statsFeatures) {
      return gameTeam.statsFeatures;
    }
    const game = await this.coreService.gamesRepository.findOne({
      where: { id: gameTeam.gameId },
      select: ['id', 'statsFeatures'],
    });
    if (!game) {
      throw new NotFoundException(
        `Game ${gameTeam.gameId} not found while resolving stats features for GameTeam ${gameTeam.id}`,
      );
    }
    return game.statsFeatures ?? DEFAULT_STATS_FEATURES;
  }

  /**
   * Reject bringing a player onto the field when the team is already at its
   * format's on-field limit (playersPerTeam, e.g. 11 for 11v11 - not the
   * full roster size, which is typically larger). This guard exists
   * specifically for the "add without a removal" path - normal
   * substitutions always pair an out with an in, so they can never exceed
   * capacity on their own.
   *
   * Fails open (skips the check) when the game's format can't be resolved,
   * matching LineupService.assertPositionCapacity's philosophy of not
   * blocking a legitimate operation over a data gap.
   */
  private async assertFieldCapacity(gameTeam: GameTeam): Promise<void> {
    const game = await this.coreService.gamesRepository.findOne({
      where: { id: gameTeam.gameId },
      relations: ['format'],
    });
    const playersPerTeam = game?.format?.playersPerTeam;
    if (playersPerTeam == null) {
      return;
    }

    const lineup = await this.lineupService.getGameLineup(gameTeam.id);
    if (lineup.currentOnField.length >= playersPerTeam) {
      throw new BadRequestException(
        `Cannot add player: team already has the maximum of ${playersPerTeam} players on the field`,
      );
    }
  }

  /**
   * Replay for single-event actions: the recorded event, or a conflict if it
   * has been deleted since.
   */
  private async loadReplayedEvent(
    actionId: string | undefined,
    eventIds: string[],
  ): Promise<GameEvent> {
    const [event] = await this.receipts.loadEvents(eventIds);
    if (!event) {
      throw new ConflictException(
        `Action ${actionId} was already applied; its events have since been deleted`,
      );
    }
    return event;
  }

  /**
   * Bring a player onto the field during a game (creates SUBSTITUTION_IN event).
   * Used at halftime or when adding a player to an empty position mid-game.
   * Unlike addPlayerToLineup, this doesn't check for existing bench/lineup events
   * since the player may already have BENCH or SUBSTITUTION_OUT events.
   */
  async bringPlayerOntoField(
    input: BringPlayerOntoFieldInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    this.coreService.ensurePlayerInfoProvided(
      input.playerId,
      input.externalPlayerName,
      'field entry',
    );

    assertClientUuid(input.eventId, 'eventId');
    const occurredAt = resolveOccurredAt(input.occurredAt);

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const features = await this.getEffectiveFeatures(gameTeam);
    const trackPosition = features.trackPositions;
    const eventType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Build metadata object with optional fields
    const metadata: Record<string, string | null> = {};
    if (input.reason) {
      metadata.reason = input.reason;
    }
    if (input.notes) {
      metadata.notes = input.notes;
    }

    const { result, replayed } = await this.receipts.applyOnce(
      {
        actionId: input.actionId,
        gameId: gameTeam.gameId,
        recordedByUserId,
        kind: 'bringPlayerOntoField',
      },
      {
        apply: async (manager) => {
          // Checked only on first application: on a retry the original add
          // may itself be what filled the field.
          await this.assertFieldCapacity(gameTeam);

          const events = manager.getRepository(GameEvent);
          // insert, not save: save() with an existing id would UPDATE that row.
          const gameEvent = events.create({
            id: input.eventId,
            gameId: gameTeam.gameId,
            gameTeamId: input.gameTeamId,
            eventTypeId: eventType.id,
            playerId: input.playerId,
            externalPlayerName: input.externalPlayerName,
            externalPlayerNumber: input.externalPlayerNumber,
            position: trackPosition
              ? input.position
              : NON_TRACKED_FIELD_POSITION,
            recordedByUserId,
            period: input.period,
            periodSecond: input.periodSecond,
            occurredAt,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          });
          await events.insert(gameEvent);
          return { result: gameEvent, eventIds: [gameEvent.id] };
        },
        replay: (eventIds) => this.loadReplayedEvent(input.actionId, eventIds),
      },
    );

    if (!replayed) {
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CREATED,
        result,
      );
    }

    return result;
  }

  /**
   * Remove a player from the field without replacement (injury, red card, etc.).
   * Creates only a SUBSTITUTION_OUT event - no paired SUBSTITUTION_IN required.
   */
  async removePlayerFromField(
    input: RemovePlayerFromFieldInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    assertClientUuid(input.eventId, 'eventId');
    const occurredAt = resolveOccurredAt(input.occurredAt);

    // 1. Get the game team
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const features = await this.getEffectiveFeatures(gameTeam);
    const trackPosition = features.trackPositions;

    const { result, replayed } = await this.receipts.applyOnce(
      {
        actionId: input.actionId,
        gameId: gameTeam.gameId,
        recordedByUserId,
        kind: 'removePlayerFromField',
      },
      {
        apply: async (manager) => {
          const events = manager.getRepository(GameEvent);

          // 2. Get the player's current on-field event
          const playerEvent = await events.findOne({
            where: { id: input.playerEventId },
            relations: ['eventType', 'player'],
          });

          if (!playerEvent) {
            throw new NotFoundException(
              `GameEvent ${input.playerEventId} not found`,
            );
          }

          // 3. Validate that the player is currently on the field
          // Note: Players enter the field via SUBSTITUTION_IN events (including starters at period 1, second 0)
          const validOnFieldTypes = ['SUBSTITUTION_IN'];
          if (!validOnFieldTypes.includes(playerEvent.eventType.name)) {
            throw new BadRequestException(
              `Player event ${input.playerEventId} is not an on-field event type. ` +
                `Expected SUBSTITUTION_IN, got ${playerEvent.eventType.name}`,
            );
          }

          // 4. Get the SUBSTITUTION_OUT event type
          const subOutType =
            this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

          // 5. Build metadata object with optional fields
          const metadata: Record<string, string | null> = {};
          if (input.reason) {
            metadata.reason = input.reason;
          }
          if (input.notes) {
            metadata.notes = input.notes;
          }

          // 6. Create SUBSTITUTION_OUT event (no parentEventId - this is an unbalanced sub)
          // insert, not save: save() with an existing id would UPDATE that row.
          const subOutEvent = events.create({
            id: input.eventId,
            gameId: gameTeam.gameId,
            gameTeamId: input.gameTeamId,
            eventTypeId: subOutType.id,
            playerId: playerEvent.playerId,
            externalPlayerName: playerEvent.externalPlayerName,
            externalPlayerNumber: playerEvent.externalPlayerNumber,
            position: trackPosition ? playerEvent.position : undefined,
            recordedByUserId,
            period: input.period,
            periodSecond: input.periodSecond,
            occurredAt,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
          });
          await events.insert(subOutEvent);
          return { result: subOutEvent, eventIds: [subOutEvent.id] };
        },
        replay: (eventIds) => this.loadReplayedEvent(input.actionId, eventIds),
      },
    );

    // 7. Publish the event - field resolvers handle relation loading for subscribers
    if (!replayed) {
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CREATED,
        result,
      );
    }

    // Return base entity - field resolvers handle relation loading on-demand
    return result;
  }

  /**
   * Replace an on-field player. Creates SUBSTITUTION_OUT and a linked
   * SUBSTITUTION_IN in one transaction.
   *
   * Outbox support: with `actionId`, a retry returns the originally created
   * events instead of substituting again. `subOutEventId`/`subInEventId`
   * let the client name the rows so later queued actions can reference
   * them before this one syncs.
   */
  async substitutePlayer(
    input: SubstitutePlayerInput,
    recordedByUserId: string,
  ): Promise<GameEvent[]> {
    // Validate before the receipt so a bad request never records one.
    this.coreService.ensurePlayerInfoProvided(
      input.playerInId,
      input.externalPlayerInName,
      'substitution (player in)',
    );
    assertClientUuid(input.subOutEventId, 'subOutEventId');
    assertClientUuid(input.subInEventId, 'subInEventId');
    const occurredAt = resolveOccurredAt(input.occurredAt);

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const features = await this.getEffectiveFeatures(gameTeam);
    const trackPosition = features.trackPositions;

    const { result, replayed } = await this.receipts.applyOnce(
      {
        actionId: input.actionId,
        gameId: gameTeam.gameId,
        recordedByUserId,
        kind: 'substitutePlayer',
      },
      {
        apply: async (manager) => {
          const events = await this.applySubstitution(
            {
              events: manager.getRepository(GameEvent),
              gameId: gameTeam.gameId,
              recordedByUserId,
              occurredAt,
            },
            trackPosition,
            input,
          );
          return { result: events, eventIds: events.map((e) => e.id) };
        },
        replay: (eventIds) => this.receipts.loadEvents(eventIds),
      },
    );

    // Publish after commit, and only once: a replay was already published.
    // SUB_OUT is the primary event; field resolvers load relations.
    if (!replayed) {
      await this.coreService.publishGameEvent(
        gameTeam.gameId,
        GameEventAction.CREATED,
        result[0],
      );
    }

    return result;
  }

  /**
   * Writes a substitution's SUBSTITUTION_OUT and linked SUBSTITUTION_IN
   * inside the caller's transaction. No receipt and no publishing - the
   * caller owns both, so a batch can write several substitutions atomically.
   */
  async applySubstitution(
    ctx: ActionWriteContext,
    trackPosition: boolean,
    input: Pick<
      SubstitutePlayerInput,
      | 'gameTeamId'
      | 'playerOutEventId'
      | 'playerInId'
      | 'externalPlayerInName'
      | 'externalPlayerInNumber'
      | 'period'
      | 'periodSecond'
      | 'subOutEventId'
      | 'subInEventId'
    >,
  ): Promise<[GameEvent, GameEvent]> {
    this.coreService.ensurePlayerInfoProvided(
      input.playerInId,
      input.externalPlayerInName,
      'substitution (player in)',
    );
    assertClientUuid(input.subOutEventId, 'subOutEventId');
    assertClientUuid(input.subInEventId, 'subInEventId');
    const { events } = ctx;

    // Read through the transaction: in a batch the outgoing player may be
    // one subbed in earlier in the same, not-yet-committed, action.
    const playerOutEvent = await events.findOne({
      where: { id: input.playerOutEventId },
      relations: ['eventType'],
    });
    if (!playerOutEvent) {
      throw new NotFoundException(
        `GameEvent ${input.playerOutEventId} not found`,
      );
    }

    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');
    const subInType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // insert, not save: save() with an existing id would UPDATE that row,
    // letting a reused client ID overwrite another event.
    const subOut = events.create({
      id: input.subOutEventId,
      gameId: ctx.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: subOutType.id,
      playerId: playerOutEvent.playerId,
      externalPlayerName: playerOutEvent.externalPlayerName,
      externalPlayerNumber: playerOutEvent.externalPlayerNumber,
      recordedByUserId: ctx.recordedByUserId,
      period: input.period,
      periodSecond: input.periodSecond,
      occurredAt: ctx.occurredAt,
      position: trackPosition ? playerOutEvent.position : undefined,
    });
    await events.insert(subOut);

    // SUBSTITUTION_IN takes the position of the player going out. When
    // position tracking is off, this still needs a non-null position -
    // otherwise the incoming player is indistinguishable from a benched one
    // (see LineupService.getGameRoster's `position != null` on-field check).
    const subIn = events.create({
      id: input.subInEventId,
      gameId: ctx.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: subInType.id,
      playerId: input.playerInId,
      externalPlayerName: input.externalPlayerInName,
      externalPlayerNumber: input.externalPlayerInNumber,
      recordedByUserId: ctx.recordedByUserId,
      period: input.period,
      periodSecond: input.periodSecond,
      occurredAt: ctx.occurredAt,
      position: trackPosition
        ? playerOutEvent.position
        : NON_TRACKED_FIELD_POSITION,
      parentEventId: subOut.id,
    });
    await events.insert(subIn);

    return [subOut, subIn];
  }

  /**
   * Delete a substitution event pair (SUBSTITUTION_OUT and its linked SUBSTITUTION_IN)
   * @param gameEventId - ID of either the SUBSTITUTION_OUT or SUBSTITUTION_IN event
   */
  async deleteSubstitution(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType', 'childEvents', 'parentEvent'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    const eventTypeName = gameEvent.eventType.name;

    if (
      eventTypeName !== 'SUBSTITUTION_OUT' &&
      eventTypeName !== 'SUBSTITUTION_IN'
    ) {
      throw new BadRequestException(
        'Can only delete SUBSTITUTION_OUT or SUBSTITUTION_IN events with this method',
      );
    }

    // Store gameId before deletion
    const gameId = gameEvent.gameId;

    // Determine the SUB_OUT event (parent) and SUB_IN event (child)
    let subOutEvent: GameEvent | null = null;
    let subInEvent: GameEvent | null = null;
    let subOutEventId: string | undefined;

    if (eventTypeName === 'SUBSTITUTION_OUT') {
      subOutEvent = gameEvent;
      subOutEventId = gameEvent.id;
      // Find the linked SUBSTITUTION_IN (child)
      subInEvent = await this.gameEventsRepository.findOne({
        where: { parentEventId: gameEvent.id },
        relations: ['eventType'],
      });
    } else {
      // eventTypeName === 'SUBSTITUTION_IN'
      subInEvent = gameEvent;
      // Find the linked SUBSTITUTION_OUT (parent)
      if (gameEvent.parentEventId) {
        subOutEventId = gameEvent.parentEventId;
        subOutEvent = await this.gameEventsRepository.findOne({
          where: { id: gameEvent.parentEventId },
          relations: ['eventType'],
        });
      }
    }

    // Delete both events (SUB_IN first due to foreign key)
    if (subInEvent) {
      await this.gameEventsRepository.remove(subInEvent);
    }
    if (subOutEvent) {
      await this.gameEventsRepository.remove(subOutEvent);
    }

    // Publish deletion event
    await this.coreService.publishGameEvent(
      gameId,
      GameEventAction.DELETED,
      undefined,
      subOutEventId,
    );

    return true;
  }

  /**
   * Delete a starter entry event (SUBSTITUTION_IN at period 1, periodSecond 0)
   * @param gameEventId - ID of the SUBSTITUTION_IN event
   */
  async deleteStarterEntry(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'SUBSTITUTION_IN') {
      throw new BadRequestException(
        'Can only delete SUBSTITUTION_IN events with this method',
      );
    }

    // Store gameId before deletion
    const gameId = gameEvent.gameId;

    // For starter entries (SUBSTITUTION_IN at minute 0), just delete the event
    await this.gameEventsRepository.remove(gameEvent);

    // Publish deletion event
    await this.coreService.publishGameEvent(
      gameId,
      GameEventAction.DELETED,
      undefined,
      gameEventId,
    );

    return true;
  }

  /**
   * Create SUBSTITUTION_OUT events for all players currently on field.
   * Used during period transitions (halftime, game end) to formally track
   * when players leave the field.
   *
   * @param gameTeamId - The game team ID
   * @param period - Period identifier (e.g., '1', '2', 'OT1')
   * @param periodSecond - Seconds elapsed within the period
   * @param recordedByUserId - User recording the events
   * @param parentEventId - Optional parent event ID
   * @returns Array of created SUB_OUT events
   */
  async createSubstitutionOutForAllOnField(
    gameTeamId: string,
    period: string,
    periodSecond: number,
    recordedByUserId: string,
    parentEventId?: string,
  ): Promise<GameEvent[]> {
    const lineup = await this.lineupService.getGameLineup(gameTeamId);
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const features = await this.getEffectiveFeatures(gameTeam);
    const trackPosition = features.trackPositions;

    // Batch create all SUB_OUT events
    const subOutEventsToCreate = lineup.currentOnField.map((player) =>
      this.gameEventsRepository.create({
        gameId: gameTeam.gameId,
        gameTeamId,
        eventTypeId: subOutType.id,
        playerId: player.playerId,
        externalPlayerName: player.externalPlayerName,
        externalPlayerNumber: player.externalPlayerNumber,
        position: trackPosition ? player.position : undefined,
        recordedByUserId,
        period,
        periodSecond,
        parentEventId,
      }),
    );

    // Single batch insert instead of N individual inserts
    const savedEvents =
      await this.gameEventsRepository.save(subOutEventsToCreate);

    return savedEvents;
  }

  /**
   * Process multiple lineup changes (substitutions and position swaps) as one
   * action in one transaction. Substitutions are processed first, then swaps,
   * so swaps can reference players who just came on - either by the
   * substitution's client `subInEventId` or by `substitutionIndex`.
   *
   * Position swaps are written by EventManagementService, passed in through
   * the facade to avoid a circular dependency.
   *
   * @returns All created events, and a map of substitution index to its
   * SUBSTITUTION_IN event ID (empty on a replay).
   */
  async batchLineupChanges(
    input: BatchLineupChangesInput,
    recordedByUserId: string,
    applySwap: ApplySwapFn,
  ): Promise<{
    events: GameEvent[];
    substitutionEventIds: Map<number, string>;
  }> {
    const occurredAt = resolveOccurredAt(input.occurredAt);
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const features = await this.getEffectiveFeatures(gameTeam);
    const substitutionEventIds = new Map<number, string>();
    const publishable: GameEvent[] = [];

    const { result, replayed } = await this.receipts.applyOnce(
      {
        actionId: input.actionId,
        gameId: gameTeam.gameId,
        recordedByUserId,
        kind: 'batchLineupChanges',
      },
      {
        apply: async (manager) => {
          const ctx: ActionWriteContext = {
            events: manager.getRepository(GameEvent),
            gameId: gameTeam.gameId,
            recordedByUserId,
            occurredAt,
          };
          const allEvents: GameEvent[] = [];

          for (let i = 0; i < input.substitutions.length; i++) {
            const sub = input.substitutions[i];
            const [subOut, subIn] = await this.applySubstitution(
              ctx,
              features.trackPositions,
              {
                gameTeamId: input.gameTeamId,
                playerOutEventId: sub.playerOutEventId,
                playerInId: sub.playerInId,
                externalPlayerInName: sub.externalPlayerInName,
                externalPlayerInNumber: sub.externalPlayerInNumber,
                period: input.period,
                periodSecond: input.periodSecond,
                subOutEventId: sub.subOutEventId,
                subInEventId: sub.subInEventId,
              },
            );
            allEvents.push(subOut, subIn);
            publishable.push(subOut);
            substitutionEventIds.set(i, subIn.id);
          }

          for (const swap of input.swaps) {
            const swapEvents = await applySwap(ctx, {
              gameTeamId: input.gameTeamId,
              player1EventId: this.resolveSwapRef(
                swap.player1,
                substitutionEventIds,
                'player1',
              ),
              player2EventId: this.resolveSwapRef(
                swap.player2,
                substitutionEventIds,
                'player2',
              ),
              period: input.period,
              periodSecond: input.periodSecond,
              swap1EventId: swap.swap1EventId,
              swap2EventId: swap.swap2EventId,
            });
            allEvents.push(...swapEvents);
            publishable.push(swapEvents[0]);
          }

          return { result: allEvents, eventIds: allEvents.map((e) => e.id) };
        },
        replay: (eventIds) => this.receipts.loadEvents(eventIds),
      },
    );

    // After commit, one message per substitution (SUB_OUT) and per swap
    // (first POSITION_SWAP), as before. Nothing on a replay.
    if (!replayed) {
      for (const event of publishable) {
        await this.coreService.publishGameEvent(
          gameTeam.gameId,
          GameEventAction.CREATED,
          event,
        );
      }
    }

    return { events: result, substitutionEventIds };
  }

  private resolveSwapRef(
    ref: BatchSwapPlayerRef,
    substitutionEventIds: Map<number, string>,
    label: 'player1' | 'player2',
  ): string {
    if (ref.eventId) return ref.eventId;
    if (ref.substitutionIndex !== undefined) {
      const resolvedId = substitutionEventIds.get(ref.substitutionIndex);
      if (!resolvedId) {
        throw new BadRequestException(
          `Could not resolve substitution index ${ref.substitutionIndex} for ${label}`,
        );
      }
      return resolvedId;
    }
    throw new BadRequestException(
      `Swap ${label} must have either eventId or substitutionIndex`,
    );
  }
}
