import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { RecordFormationChangeInput } from '../dto/record-formation-change.input';
import {
  RecordPositionChangeInput,
  PositionChangeReason,
} from '../dto/record-position-change.input';
import { SwapPositionsInput } from '../dto/swap-positions.input';
import {
  DependentEvent,
  DependentEventsResult,
} from '../dto/dependent-event.output';
import { GameEventAction } from '../dto/game-event-subscription.output';

import { EventCoreService } from './event-core.service';
import { GoalService } from './goal.service';
import { SubstitutionService } from './substitution.service';

/**
 * Service responsible for event management operations.
 * Handles event queries, cascading deletes, conflict resolution, and position changes.
 */
@Injectable()
export class EventManagementService {
  constructor(
    private readonly coreService: EventCoreService,
    @Inject(forwardRef(() => GoalService))
    private readonly goalService: GoalService,
    @Inject(forwardRef(() => SubstitutionService))
    private readonly substitutionService: SubstitutionService,
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  private get teamsRepository() {
    return this.coreService.teamsRepository;
  }

  /**
   * Record a formation change event.
   * Creates a FORMATION_CHANGE event and updates the GameTeam's formation.
   */
  async recordFormationChange(
    input: RecordFormationChangeInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const formationEventType =
      this.coreService.getEventTypeByName('FORMATION_CHANGE');

    // Get the current formation before updating
    const previousFormation = gameTeam.formation;

    // Create FORMATION_CHANGE event
    const formationEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: formationEventType.id,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      formation: input.formation,
      metadata: {
        previousFormation: previousFormation || null,
        newFormation: input.formation,
      },
    });

    const savedEvent = await this.gameEventsRepository.save(formationEvent);

    // Update the GameTeam's current formation
    await this.gameTeamsRepository.update(
      { id: input.gameTeamId },
      { formation: input.formation },
    );

    // Return event with relations loaded
    const eventWithRelations = await this.gameEventsRepository.findOneOrFail({
      where: { id: savedEvent.id },
      relations: ['eventType', 'recordedByUser', 'gameTeam', 'game'],
    });

    // Publish the event to subscribers
    await this.coreService.publishGameEvent(
      gameTeam.gameId,
      GameEventAction.CREATED,
      eventWithRelations,
    );

    return eventWithRelations;
  }

  /**
   * Record a position change event for a player.
   * Creates a POSITION_CHANGE event to track when a player changes position mid-game.
   * This enables accurate position-time tracking for statistics.
   */
  async recordPositionChange(
    input: RecordPositionChangeInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);
    const positionChangeType =
      this.coreService.getEventTypeByName('POSITION_CHANGE');

    // Get the player's current entry event to find their current position
    const playerEntryEvent = await this.gameEventsRepository.findOne({
      where: { id: input.playerEventId },
      relations: ['eventType', 'player'],
    });

    if (!playerEntryEvent) {
      throw new NotFoundException(
        `Player event ${input.playerEventId} not found`,
      );
    }

    // Get the player's current position (from latest position-affecting event)
    const events = await this.gameEventsRepository.find({
      where: { gameTeamId: input.gameTeamId },
      relations: ['eventType'],
      order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
    });

    // Find the player's current position by replaying their position history
    const playerKey =
      playerEntryEvent.playerId || playerEntryEvent.externalPlayerName;
    let previousPosition: string | undefined;

    for (const event of events) {
      const eventPlayerKey = event.playerId || event.externalPlayerName;
      if (eventPlayerKey !== playerKey) continue;

      // Track position from relevant events
      if (
        [
          'STARTING_LINEUP',
          'SUBSTITUTION_IN',
          'POSITION_SWAP',
          'POSITION_CHANGE',
        ].includes(event.eventType.name)
      ) {
        if (event.position) {
          previousPosition = event.position;
        }
      }
    }

    // Create POSITION_CHANGE event
    const positionChangeEvent = this.gameEventsRepository.create({
      gameId: gameTeam.gameId,
      gameTeamId: input.gameTeamId,
      eventTypeId: positionChangeType.id,
      playerId: playerEntryEvent.playerId,
      externalPlayerName: playerEntryEvent.externalPlayerName,
      externalPlayerNumber: playerEntryEvent.externalPlayerNumber,
      recordedByUserId,
      gameMinute: input.gameMinute,
      gameSecond: input.gameSecond,
      position: input.newPosition,
      metadata: {
        previousPosition: previousPosition || null,
        newPosition: input.newPosition,
        reason: input.reason || PositionChangeReason.TACTICAL,
      },
    });

    const savedEvent =
      await this.gameEventsRepository.save(positionChangeEvent);

    // Return event with relations loaded
    const eventWithRelations = await this.gameEventsRepository.findOneOrFail({
      where: { id: savedEvent.id },
      relations: ['eventType', 'player', 'recordedByUser', 'gameTeam', 'game'],
    });

    // Publish the event to subscribers
    await this.coreService.publishGameEvent(
      gameTeam.gameId,
      GameEventAction.CREATED,
      eventWithRelations,
    );

    return eventWithRelations;
  }

  async swapPositions(
    input: SwapPositionsInput,
    recordedByUserId: string,
  ): Promise<GameEvent[]> {
    const gameTeam = await this.coreService.getGameTeam(input.gameTeamId);

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
        `GameEvent ${input.player1EventId} not found`,
      );
    }
    if (!player2Event) {
      throw new NotFoundException(
        `GameEvent ${input.player2EventId} not found`,
      );
    }

    // Both players must have positions
    if (!player1Event.position || !player2Event.position) {
      throw new BadRequestException('Both players must have positions to swap');
    }

    const swapEventType = this.coreService.getEventTypeByName('POSITION_SWAP');

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
      this.coreService.loadEventWithRelations(savedSwap1.id),
      this.coreService.loadEventWithRelations(savedSwap2.id),
    ]);

    // Publish the position swap event (use swap1 as the primary event)
    await this.coreService.publishGameEvent(
      gameTeam.gameId,
      GameEventAction.CREATED,
      swap1WithRelations,
    );

    return [swap1WithRelations, swap2WithRelations];
  }

  /**
   * Delete a position swap event pair
   * @param gameEventId - ID of either swap event
   */
  async deletePositionSwap(gameEventId: string): Promise<boolean> {
    const gameEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: ['eventType', 'childEvents', 'parentEvent'],
    });

    if (!gameEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    if (gameEvent.eventType.name !== 'POSITION_SWAP') {
      throw new BadRequestException(
        'Can only delete POSITION_SWAP events with this method',
      );
    }

    // Store gameId before deletion
    const gameId = gameEvent.gameId;

    // Position swaps come in pairs - find both
    let swap1: GameEvent | null = null;
    let swap2: GameEvent | null = null;
    let swap1EventId: string | undefined;

    if (gameEvent.parentEventId) {
      // This is the child swap, find the parent
      swap2 = gameEvent;
      swap1EventId = gameEvent.parentEventId;
      swap1 = await this.gameEventsRepository.findOne({
        where: { id: gameEvent.parentEventId },
        relations: ['eventType'],
      });
    } else {
      // This is the parent swap, find the child
      swap1 = gameEvent;
      swap1EventId = gameEvent.id;
      swap2 = await this.gameEventsRepository.findOne({
        where: { parentEventId: gameEvent.id },
        relations: ['eventType'],
      });
    }

    // Delete both events (child first due to foreign key)
    if (swap2) {
      await this.gameEventsRepository.remove(swap2);
    }
    if (swap1) {
      await this.gameEventsRepository.remove(swap1);
    }

    // Publish deletion event
    await this.coreService.publishGameEvent(
      gameId,
      GameEventAction.DELETED,
      undefined,
      swap1EventId,
    );

    return true;
  }

  /**
   * Find all events that depend on a given event.
   * Dependencies are determined by:
   * - Child events (e.g., assists linked to goals via parentEventId)
   * - Same player involved + occurs after the given event
   * - In the same game team
   *
   * Special handling:
   * - For goals: includes child events (assists)
   * - For assists found as player-based dependents: includes the parent goal
   */
  async findDependentEvents(
    gameEventId: string,
  ): Promise<DependentEventsResult> {
    const sourceEvent = await this.gameEventsRepository.findOne({
      where: { id: gameEventId },
      relations: [
        'eventType',
        'gameTeam',
        'gameTeam.team',
        'childEvents',
        'childEvents.eventType',
      ],
    });

    if (!sourceEvent) {
      throw new NotFoundException(`GameEvent ${gameEventId} not found`);
    }

    // Track dependent events by ID to avoid duplicates
    const dependentEventsMap = new Map<string, DependentEvent>();

    // Helper to get player name
    const getPlayerName = async (
      playerId?: string,
      externalPlayerName?: string,
    ): Promise<string> => {
      if (externalPlayerName) return externalPlayerName;
      if (!playerId) return 'Unknown';

      const team = sourceEvent.gameTeam?.team;
      if (team) {
        const fullTeam = await this.teamsRepository.findOne({
          where: { id: team.id },
          relations: ['roster', 'roster.user'],
        });
        const teamPlayer = fullTeam?.roster?.find(
          (tp: { userId: string }) => tp.userId === playerId,
        );
        if (teamPlayer?.user) {
          const fullName = `${teamPlayer.user.firstName || ''} ${
            teamPlayer.user.lastName || ''
          }`.trim();
          return fullName || teamPlayer.user.email || 'Unknown';
        }
      }
      return 'Unknown';
    };

    // Helper to build description
    const getDescription = (eventTypeName: string): string => {
      switch (eventTypeName) {
        case 'GOAL':
          return 'Goal scored';
        case 'ASSIST':
          return 'Assist';
        case 'SUBSTITUTION_OUT':
          return 'Substituted out';
        case 'SUBSTITUTION_IN':
          return 'Substituted in';
        case 'POSITION_SWAP':
          return 'Position swap';
        case 'POSITION_CHANGE':
          return 'Position change';
        default:
          return eventTypeName;
      }
    };

    // Helper to add event to dependents map
    const addDependentEvent = async (event: GameEvent): Promise<void> => {
      if (dependentEventsMap.has(event.id)) return;
      if (event.id === gameEventId) return;

      const playerName = await getPlayerName(
        event.playerId,
        event.externalPlayerName,
      );

      dependentEventsMap.set(event.id, {
        id: event.id,
        eventType: event.eventType.name,
        gameMinute: event.gameMinute,
        gameSecond: event.gameSecond,
        playerName,
        description: getDescription(event.eventType.name),
      });
    };

    // 1. Add child events (e.g., assists for goals)
    if (sourceEvent.childEvents?.length > 0) {
      for (const child of sourceEvent.childEvents) {
        await addDependentEvent(child);
      }
    }

    // 2. Find player-based dependents (same player, later time)
    const playerIds: string[] = [];
    const externalPlayerNames: string[] = [];

    // For substitution, we care about the player entering (they have future events)
    if (sourceEvent.eventType.name === 'SUBSTITUTION_OUT') {
      // The player going out won't have future events, but we need to check
      // if there's a linked SUB_IN and that player's future events
      const linkedSubIn = await this.gameEventsRepository.findOne({
        where: { parentEventId: sourceEvent.id },
      });
      if (linkedSubIn) {
        if (linkedSubIn.playerId) playerIds.push(linkedSubIn.playerId);
        if (linkedSubIn.externalPlayerName)
          externalPlayerNames.push(linkedSubIn.externalPlayerName);
      }
    } else if (sourceEvent.eventType.name === 'SUBSTITUTION_IN') {
      // The player coming in - check their future events
      if (sourceEvent.playerId) playerIds.push(sourceEvent.playerId);
      if (sourceEvent.externalPlayerName)
        externalPlayerNames.push(sourceEvent.externalPlayerName);
    } else if (sourceEvent.eventType.name === 'POSITION_SWAP') {
      // For position swaps, both players involved could have future events
      if (sourceEvent.playerId) playerIds.push(sourceEvent.playerId);
      if (sourceEvent.externalPlayerName)
        externalPlayerNames.push(sourceEvent.externalPlayerName);

      // Find the paired swap event
      const pairedSwap = await this.gameEventsRepository.findOne({
        where: sourceEvent.parentEventId
          ? { id: sourceEvent.parentEventId }
          : { parentEventId: sourceEvent.id },
      });
      if (pairedSwap) {
        if (pairedSwap.playerId) playerIds.push(pairedSwap.playerId);
        if (pairedSwap.externalPlayerName)
          externalPlayerNames.push(pairedSwap.externalPlayerName);
      }
    } else {
      // For other events (GOAL, etc.), just use the event's player
      if (sourceEvent.playerId) playerIds.push(sourceEvent.playerId);
      if (sourceEvent.externalPlayerName)
        externalPlayerNames.push(sourceEvent.externalPlayerName);
    }

    // If we have players to track, find their future events
    if (playerIds.length > 0 || externalPlayerNames.length > 0) {
      const sourceTimeInSeconds =
        sourceEvent.gameMinute * 60 + sourceEvent.gameSecond;

      // Get all events for the same game team
      const allEvents = await this.gameEventsRepository.find({
        where: { gameTeamId: sourceEvent.gameTeamId },
        relations: ['eventType', 'parentEvent', 'parentEvent.eventType'],
        order: { gameMinute: 'ASC', gameSecond: 'ASC' },
      });

      for (const event of allEvents) {
        // Skip the source event itself
        if (event.id === gameEventId) continue;

        // Skip events that are direct children (already handled above)
        if (event.parentEventId === gameEventId) continue;

        // Skip if source event is a child of this event
        if (sourceEvent.parentEventId === event.id) continue;

        // Check if this event is after the source event
        const eventTimeInSeconds = event.gameMinute * 60 + event.gameSecond;
        if (eventTimeInSeconds <= sourceTimeInSeconds) continue;

        // Check if this event involves one of our players
        const involvesPlayer =
          (event.playerId && playerIds.includes(event.playerId)) ||
          (event.externalPlayerName &&
            externalPlayerNames.includes(event.externalPlayerName));

        if (!involvesPlayer) continue;

        // Add this event as a dependent
        await addDependentEvent(event);

        // Note: For assists, we only delete the assist itself, not the parent goal.
        // The goal still happened - we just lose the assist record.
      }
    }

    // Convert map to array and sort by game time
    const dependentEvents = Array.from(dependentEventsMap.values()).sort(
      (a, b) => {
        const timeA = a.gameMinute * 60 + a.gameSecond;
        const timeB = b.gameMinute * 60 + b.gameSecond;
        return timeA - timeB;
      },
    );

    const count = dependentEvents.length;
    let warningMessage: string | undefined;

    if (count > 0) {
      const hasAssists = dependentEvents.some((e) => e.eventType === 'ASSIST');

      if (hasAssists) {
        const assistCount = dependentEvents.filter(
          (e) => e.eventType === 'ASSIST',
        ).length;
        warningMessage = `This action will also delete ${count} dependent event${
          count > 1 ? 's' : ''
        }. Note: ${assistCount} assist${
          assistCount > 1 ? 's' : ''
        } will be removed but the associated goal${
          assistCount > 1 ? 's' : ''
        } will remain.`;
      } else {
        warningMessage = `This action will also delete ${count} dependent event${
          count > 1 ? 's' : ''
        } for this player that occurred after this event.`;
      }
    }

    return {
      dependentEvents,
      count,
      canDelete: true, // Always allow deletion, but with warning
      warningMessage,
    };
  }

  /**
   * Delete an event and all its dependent events (cascade delete)
   */
  async deleteEventWithCascade(
    gameEventId: string,
    eventType: 'goal' | 'substitution' | 'position_swap' | 'starter_entry',
  ): Promise<boolean> {
    // First, find all dependent events
    const { dependentEvents } = await this.findDependentEvents(gameEventId);

    // Track which events have been deleted to avoid double-deletion
    const deletedIds = new Set<string>();

    // Delete dependent events in reverse chronological order (latest first)
    const sortedDependents = [...dependentEvents].sort((a, b) => {
      const timeA = a.gameMinute * 60 + a.gameSecond;
      const timeB = b.gameMinute * 60 + b.gameSecond;
      return timeB - timeA; // Descending order
    });

    for (const dep of sortedDependents) {
      // Skip if already deleted
      if (deletedIds.has(dep.id)) continue;

      // Determine the type of event and delete appropriately
      const depEvent = await this.gameEventsRepository.findOne({
        where: { id: dep.id },
        relations: ['eventType'],
      });

      if (!depEvent) continue;

      const depEventType = depEvent.eventType.name;

      if (depEventType === 'GOAL') {
        await this.goalService.deleteGoal(dep.id);
        deletedIds.add(dep.id);
      } else if (
        depEventType === 'SUBSTITUTION_OUT' ||
        depEventType === 'SUBSTITUTION_IN'
      ) {
        // Check if it's a starter entry (minute 0, no parent)
        if (
          depEventType === 'SUBSTITUTION_IN' &&
          depEvent.gameMinute === 0 &&
          depEvent.gameSecond === 0 &&
          !depEvent.parentEventId
        ) {
          await this.substitutionService.deleteStarterEntry(dep.id);
        } else {
          await this.substitutionService.deleteSubstitution(dep.id);
        }
        deletedIds.add(dep.id);
      } else if (depEventType === 'POSITION_SWAP') {
        await this.deletePositionSwap(dep.id);
        deletedIds.add(dep.id);
      } else if (depEventType === 'ASSIST') {
        // Delete just the assist - the goal remains but without an assist record
        await this.gameEventsRepository.delete(dep.id);
        deletedIds.add(dep.id);
      }
    }

    // Now delete the original event
    switch (eventType) {
      case 'goal':
        return this.goalService.deleteGoal(gameEventId);
      case 'substitution':
        return this.substitutionService.deleteSubstitution(gameEventId);
      case 'position_swap':
        return this.deletePositionSwap(gameEventId);
      case 'starter_entry':
        return this.substitutionService.deleteStarterEntry(gameEventId);
    }
  }

  /**
   * Resolve an event conflict by either:
   * - Keeping only the selected event and deleting others (keepAll = false)
   * - Keeping all events as valid (keepAll = true) - clears conflictId from all
   */
  async resolveEventConflict(
    conflictId: string,
    selectedEventId: string,
    keepAll?: boolean,
  ): Promise<GameEvent> {
    // Find all events with this conflictId
    const conflictingEvents = await this.gameEventsRepository.find({
      where: { conflictId },
      relations: ['eventType', 'gameTeam', 'childEvents'],
    });

    if (conflictingEvents.length === 0) {
      throw new NotFoundException(
        `No events found with conflict ID: ${conflictId}`,
      );
    }

    const selectedEvent = conflictingEvents.find(
      (e) => e.id === selectedEventId,
    );
    if (!selectedEvent) {
      throw new BadRequestException(
        `Selected event ${selectedEventId} not found in conflict ${conflictId}`,
      );
    }

    const gameId = selectedEvent.gameId;

    if (keepAll) {
      // Keep all events as valid - just clear the conflictId
      for (const event of conflictingEvents) {
        await this.gameEventsRepository.update(
          { id: event.id },
          { conflictId: undefined },
        );
      }

      // Notify subscribers that conflict is resolved
      await this.coreService.publishGameEvent(gameId, GameEventAction.UPDATED);
    } else {
      // Keep only the selected event, delete others
      const eventsToDelete = conflictingEvents.filter(
        (e) => e.id !== selectedEventId,
      );

      for (const event of eventsToDelete) {
        // For goals, use deleteGoal to handle score decrement and child events
        if (event.eventType.name === 'GOAL') {
          await this.goalService.deleteGoal(event.id);
        } else {
          // For other event types, delete directly
          if (event.childEvents?.length > 0) {
            await this.gameEventsRepository.remove(event.childEvents);
          }
          await this.gameEventsRepository.remove(event);
        }
      }

      // Clear conflictId from the selected event
      await this.gameEventsRepository.update(
        { id: selectedEventId },
        { conflictId: undefined },
      );
    }

    // Return the selected event with full relations
    return this.coreService.loadEventWithRelations(selectedEventId);
  }
}
