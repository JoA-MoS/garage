import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { SubstitutePlayerInput } from '../dto/substitute-player.input';
import { BringPlayerOntoFieldInput } from '../dto/bring-player-onto-field.input';
import { RemovePlayerFromFieldInput } from '../dto/remove-player-from-field.input';
import { BatchLineupChangesInput } from '../dto/batch-lineup-changes.input';
import { SwapPositionsInput } from '../dto/swap-positions.input';
import { GameEventAction } from '../dto/game-event-subscription.output';

import { EventCoreService } from './event-core.service';
import { LineupService } from './lineup.service';

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
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
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

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const eventType = this.coreService.getEventTypeByName('SUBSTITUTION_IN');

    // Build metadata object with optional fields
    const metadata: Record<string, string | null> = {};
    if (input.period !== undefined) {
      metadata.period = String(input.period);
    }
    if (input.reason) {
      metadata.reason = input.reason;
    }
    if (input.notes) {
      metadata.notes = input.notes;
    }

    const gameEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: eventType.id,
      playerId: input.playerId,
      externalPlayerName: input.externalPlayerName,
      externalPlayerNumber: input.externalPlayerNumber,
      position: input.position,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond ?? 0,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    const savedEvent = await this.gameEventsRepository.save(gameEvent);

    return this.coreService.loadEventWithRelations(savedEvent.id);
  }

  /**
   * Remove a player from the field without replacement (injury, red card, etc.).
   * Creates only a SUBSTITUTION_OUT event - no paired SUBSTITUTION_IN required.
   */
  async removePlayerFromField(
    input: RemovePlayerFromFieldInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    // 1. Get the game team
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);

    // 2. Get the player's current on-field event
    const playerEvent = await this.gameEventsRepository.findOne({
      where: { id: input.playerEventId },
      relations: ['eventType', 'player'],
    });

    if (!playerEvent) {
      throw new NotFoundException(`GameEvent ${input.playerEventId} not found`);
    }

    // 3. Validate that the player is currently on the field
    const validOnFieldTypes = ['STARTING_LINEUP', 'SUBSTITUTION_IN'];
    if (!validOnFieldTypes.includes(playerEvent.eventType.name)) {
      throw new BadRequestException(
        `Player event ${input.playerEventId} is not an on-field event type. ` +
          `Expected STARTING_LINEUP or SUBSTITUTION_IN, got ${playerEvent.eventType.name}`,
      );
    }

    // 4. Get the SUBSTITUTION_OUT event type
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

    // 5. Build metadata object with optional fields
    const metadata: Record<string, string | null> = {};
    if (input.period !== undefined) {
      metadata.period = String(input.period);
    }
    if (input.reason) {
      metadata.reason = input.reason;
    }
    if (input.notes) {
      metadata.notes = input.notes;
    }

    // 6. Create SUBSTITUTION_OUT event (no parentEventId - this is an unbalanced sub)
    const subOutEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: subOutType.id,
      playerId: playerEvent.playerId,
      externalPlayerName: playerEvent.externalPlayerName,
      externalPlayerNumber: playerEvent.externalPlayerNumber,
      position: playerEvent.position,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond ?? 0,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    const savedEvent = await this.gameEventsRepository.save(subOutEvent);

    // 7. Publish the event
    const eventWithRelations = await this.coreService.loadEventWithRelations(
      savedEvent.id,
    );

    await this.coreService.publishGameEvent(
      gameTeam.gameId,
      GameEventAction.CREATED,
      eventWithRelations,
    );

    return eventWithRelations;
  }

  async substitutePlayer(
    input: SubstitutePlayerInput,
    recordedByUserId: string,
  ): Promise<GameEvent[]> {
    // Player coming in must be identified
    this.coreService.ensurePlayerInfoProvided(
      input.playerInId,
      input.externalPlayerInName,
      'substitution (player in)',
    );

    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);

    // Get the player being subbed out
    const playerOutEvent = await this.gameEventsRepository.findOne({
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
      this.coreService.loadEventWithRelations(savedSubOut.id),
      this.coreService.loadEventWithRelations(savedSubIn.id),
    ]);

    // Publish the substitution event (use SUB_OUT as the primary event)
    await this.coreService.publishGameEvent(
      gameTeam.gameId,
      GameEventAction.CREATED,
      subOutWithRelations,
    );

    return [subOutWithRelations, subInWithRelations];
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
   * Delete a starter entry event (SUBSTITUTION_IN at minute 0)
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
   * @param gameMinute - Game minute for the events
   * @param gameSecond - Game second for the events
   * @param recordedByUserId - User recording the events
   * @param period - Period number (e.g., '1', '2') for stats calculation
   * @returns Array of created SUB_OUT events
   */
  async createSubstitutionOutForAllOnField(
    gameTeamId: string,
    gameMinute: number,
    gameSecond: number,
    recordedByUserId: string,
    parentEventId?: string,
    period?: string,
  ): Promise<GameEvent[]> {
    const lineup = await this.lineupService.getGameLineup(gameTeamId);
    const subOutType = this.coreService.getEventTypeByName('SUBSTITUTION_OUT');

    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const events: GameEvent[] = [];

    for (const player of lineup.currentOnField) {
      const subOutEvent = this.gameEventsRepository.create({
        gameId: gameTeam.gameId,
        gameTeamId,
        eventTypeId: subOutType.id,
        playerId: player.playerId,
        externalPlayerName: player.externalPlayerName,
        externalPlayerNumber: player.externalPlayerNumber,
        position: player.position,
        recordedByUserId,
        gameMinute,
        gameSecond,
        parentEventId,
        period,
      });

      const savedEvent = await this.gameEventsRepository.save(subOutEvent);
      events.push(savedEvent);
    }

    return events;
  }

  /**
   * Process multiple lineup changes (substitutions and position swaps) in a single operation.
   * Substitutions are processed first, then swaps. This allows swaps to reference
   * players who just came on as substitutes.
   *
   * Note: Position swaps are delegated to EventManagementService through the facade.
   *
   * @returns Object containing all created events and a map of substitution indices to their SUBSTITUTION_IN event IDs
   */
  async batchLineupChanges(
    input: BatchLineupChangesInput,
    recordedByUserId: string,
    swapPositionsFn: (
      input: SwapPositionsInput,
      userId: string,
    ) => Promise<GameEvent[]>,
  ): Promise<{
    events: GameEvent[];
    substitutionEventIds: Map<number, string>;
  }> {
    const allEvents: GameEvent[] = [];
    const substitutionEventIds = new Map<number, string>();

    // Process all substitutions first
    for (let i = 0; i < input.substitutions.length; i++) {
      const sub = input.substitutions[i];
      const subInput: SubstitutePlayerInput = {
        gameTeamId: input.gameTeamId,
        playerOutEventId: sub.playerOutEventId,
        playerInId: sub.playerInId,
        externalPlayerInName: sub.externalPlayerInName,
        externalPlayerInNumber: sub.externalPlayerInNumber,
        gameMinute: input.gameMinute,
        gameSecond: input.gameSecond,
      };

      const events = await this.substitutePlayer(subInput, recordedByUserId);
      allEvents.push(...events);

      // Find the SUBSTITUTION_IN event and store its ID for swap references
      const subInEvent = events.find(
        (e) => e.eventType?.name === 'SUBSTITUTION_IN',
      );
      if (subInEvent) {
        substitutionEventIds.set(i, subInEvent.id);
      }
    }

    // Process all position swaps, resolving player references
    for (const swap of input.swaps) {
      // Resolve player1 event ID
      let player1EventId: string;
      if (swap.player1.eventId) {
        player1EventId = swap.player1.eventId;
      } else if (swap.player1.substitutionIndex !== undefined) {
        const resolvedId = substitutionEventIds.get(
          swap.player1.substitutionIndex,
        );
        if (!resolvedId) {
          throw new BadRequestException(
            `Could not resolve substitution index ${swap.player1.substitutionIndex} for player1`,
          );
        }
        player1EventId = resolvedId;
      } else {
        throw new BadRequestException(
          'Swap player1 must have either eventId or substitutionIndex',
        );
      }

      // Resolve player2 event ID
      let player2EventId: string;
      if (swap.player2.eventId) {
        player2EventId = swap.player2.eventId;
      } else if (swap.player2.substitutionIndex !== undefined) {
        const resolvedId = substitutionEventIds.get(
          swap.player2.substitutionIndex,
        );
        if (!resolvedId) {
          throw new BadRequestException(
            `Could not resolve substitution index ${swap.player2.substitutionIndex} for player2`,
          );
        }
        player2EventId = resolvedId;
      } else {
        throw new BadRequestException(
          'Swap player2 must have either eventId or substitutionIndex',
        );
      }

      const swapInput: SwapPositionsInput = {
        gameTeamId: input.gameTeamId,
        player1EventId,
        player2EventId,
        gameMinute: input.gameMinute,
        gameSecond: input.gameSecond,
      };

      const events = await swapPositionsFn(swapInput, recordedByUserId);
      allEvents.push(...events);
    }

    return { events: allEvents, substitutionEventIds };
  }
}
