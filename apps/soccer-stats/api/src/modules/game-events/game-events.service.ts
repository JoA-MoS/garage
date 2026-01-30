import { Injectable, OnModuleInit } from '@nestjs/common';

import { GameEvent } from '../../entities/game-event.entity';

import { SubstitutePlayerInput } from './dto/substitute-player.input';
import { RecordGoalInput } from './dto/record-goal.input';
import { UpdateGoalInput } from './dto/update-goal.input';
import { RecordFormationChangeInput } from './dto/record-formation-change.input';
import { RecordPositionChangeInput } from './dto/record-position-change.input';
import { SwapPositionsInput } from './dto/swap-positions.input';
import { BatchLineupChangesInput } from './dto/batch-lineup-changes.input';
import { GameLineup } from './dto/game-lineup.output';
import { GameRoster } from './dto/game-roster.output';
import { PlayerPositionStats } from './dto/player-position-stats.output';
import { PlayerFullStats } from './dto/player-full-stats.output';
import { PlayerStatsInput } from './dto/player-stats.input';
import { DependentEventsResult } from './dto/dependent-event.output';
import { SetSecondHalfLineupInput } from './dto/set-second-half-lineup.input';
import { SecondHalfLineupResult } from './dto/set-second-half-lineup.output';
import { StartPeriodInput } from './dto/start-period.input';
import { EndPeriodInput } from './dto/end-period.input';
import { PeriodResult } from './dto/period-result.output';
import { RemovePlayerFromFieldInput } from './dto/remove-player-from-field.input';
import { BringPlayerOntoFieldInput } from './dto/bring-player-onto-field.input';
import { AddToGameRosterInput } from './dto/add-to-game-roster.input';
import {
  EventCoreService,
  LineupService,
  GoalService,
  SubstitutionService,
  StatsService,
  PeriodService,
  EventManagementService,
} from './services';

/**
 * Facade service for game event operations.
 *
 * This service acts as the public API for game events, delegating to specialized
 * services for implementation. This pattern provides:
 * - Backward compatibility with existing resolvers and consumers
 * - Single entry point for all game event operations
 * - Clean separation of concerns in the underlying services
 *
 * Service responsibilities:
 * - EventCoreService: Shared utilities, event type caching, publishing
 * - LineupService: Roster and lineup management
 * - GoalService: Goal recording and management
 * - SubstitutionService: Substitution operations
 * - StatsService: Player statistics calculations
 * - PeriodService: Period and halftime management
 * - EventManagementService: Event queries, cascades, conflicts
 */
@Injectable()
export class GameEventsService implements OnModuleInit {
  constructor(
    private readonly coreService: EventCoreService,
    private readonly lineupService: LineupService,
    private readonly goalService: GoalService,
    private readonly substitutionService: SubstitutionService,
    private readonly statsService: StatsService,
    private readonly periodService: PeriodService,
    private readonly eventManagementService: EventManagementService,
  ) {}

  /**
   * Initialize the service by loading event types into cache.
   * Delegates to EventCoreService.
   */
  async onModuleInit(): Promise<void> {
    // EventCoreService.onModuleInit is called automatically by NestJS
    // No additional initialization needed here
  }

  // ========================================
  // Lineup Operations (LineupService)
  // ========================================

  async removeFromLineup(gameEventId: string): Promise<boolean> {
    return this.lineupService.removeFromLineup(gameEventId);
  }

  async updatePlayerPosition(
    gameEventId: string,
    position: string,
  ): Promise<GameEvent> {
    return this.lineupService.updatePlayerPosition(gameEventId, position);
  }

  async getGameLineup(gameTeamId: string): Promise<GameLineup> {
    return this.lineupService.getGameLineup(gameTeamId);
  }

  async getGameRoster(gameTeamId: string): Promise<GameRoster> {
    return this.lineupService.getGameRoster(gameTeamId);
  }

  async findEventsByGameTeam(gameTeamId: string): Promise<GameEvent[]> {
    return this.lineupService.findEventsByGameTeam(gameTeamId);
  }

  async findOne(id: string): Promise<GameEvent | null> {
    return this.lineupService.findOne(id);
  }

  /**
   * Add a player to the game roster.
   * Creates a GAME_ROSTER event.
   *
   * This replaces the old addToBench and addToLineup mutations:
   * - Without position: equivalent to addToBench (player on roster, available to sub in)
   * - With position: equivalent to addToLineup (planned starter with assigned position)
   */
  async addPlayerToGameRoster(
    input: AddToGameRosterInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.lineupService.addPlayerToGameRoster(input, recordedByUserId);
  }

  // ========================================
  // Goal Operations (GoalService)
  // ========================================

  async recordGoal(
    input: RecordGoalInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.goalService.recordGoal(input, recordedByUserId);
  }

  async updateGoal(input: UpdateGoalInput): Promise<GameEvent> {
    return this.goalService.updateGoal(input);
  }

  async deleteGoal(gameEventId: string): Promise<boolean> {
    return this.goalService.deleteGoal(gameEventId);
  }

  // ========================================
  // Substitution Operations (SubstitutionService)
  // ========================================

  async bringPlayerOntoField(
    input: BringPlayerOntoFieldInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.substitutionService.bringPlayerOntoField(
      input,
      recordedByUserId,
    );
  }

  async removePlayerFromField(
    input: RemovePlayerFromFieldInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.substitutionService.removePlayerFromField(
      input,
      recordedByUserId,
    );
  }

  async substitutePlayer(
    input: SubstitutePlayerInput,
    recordedByUserId: string,
  ): Promise<GameEvent[]> {
    return this.substitutionService.substitutePlayer(input, recordedByUserId);
  }

  async deleteSubstitution(gameEventId: string): Promise<boolean> {
    return this.substitutionService.deleteSubstitution(gameEventId);
  }

  async deleteStarterEntry(gameEventId: string): Promise<boolean> {
    return this.substitutionService.deleteStarterEntry(gameEventId);
  }

  /**
   * Create SUBSTITUTION_OUT events for all players currently on field.
   * Used during period transitions (halftime, game end).
   */
  async createSubstitutionOutForAllOnField(
    gameTeamId: string,
    period: string,
    periodSecond: number,
    recordedByUserId: string,
    parentEventId?: string,
  ): Promise<GameEvent[]> {
    return this.substitutionService.createSubstitutionOutForAllOnField(
      gameTeamId,
      period,
      periodSecond,
      recordedByUserId,
      parentEventId,
    );
  }

  /**
   * Process multiple lineup changes (substitutions and position swaps) in a single operation.
   */
  async batchLineupChanges(
    input: BatchLineupChangesInput,
    recordedByUserId: string,
  ): Promise<{
    events: GameEvent[];
    substitutionEventIds: Map<number, string>;
  }> {
    // Provide swapPositions function to SubstitutionService to avoid circular dependency
    return this.substitutionService.batchLineupChanges(
      input,
      recordedByUserId,
      (swapInput, userId) =>
        this.eventManagementService.swapPositions(swapInput, userId),
    );
  }

  // ========================================
  // Statistics Operations (StatsService)
  // ========================================

  async getPlayerPositionStats(
    gameTeamId: string,
  ): Promise<PlayerPositionStats[]> {
    return this.statsService.getPlayerPositionStats(gameTeamId);
  }

  async getPlayerStats(input: PlayerStatsInput): Promise<PlayerFullStats[]> {
    return this.statsService.getPlayerStats(input);
  }

  // ========================================
  // Period Operations (PeriodService)
  // ========================================

  async startPeriod(
    input: StartPeriodInput,
    recordedByUserId: string,
  ): Promise<PeriodResult> {
    return this.periodService.startPeriod(input, recordedByUserId);
  }

  async endPeriod(
    input: EndPeriodInput,
    recordedByUserId: string,
  ): Promise<PeriodResult> {
    return this.periodService.endPeriod(input, recordedByUserId);
  }

  async setSecondHalfLineup(
    input: SetSecondHalfLineupInput,
    recordedByUserId: string,
  ): Promise<SecondHalfLineupResult> {
    return this.periodService.setSecondHalfLineup(input, recordedByUserId);
  }

  /**
   * Ensure second half lineup exists by copying first half ending lineup if needed.
   */
  async ensureSecondHalfLineupExists(
    gameTeamId: string,
    halftimeMinute: number,
    recordedByUserId: string,
    parentEventId?: string,
  ): Promise<void> {
    return this.periodService.ensureSecondHalfLineupExists(
      gameTeamId,
      halftimeMinute,
      recordedByUserId,
      parentEventId,
    );
  }

  /**
   * Link orphan SUB_IN events to the PERIOD_START period=2 event.
   */
  async linkOrphanSubInsToSecondHalfPeriodStart(
    gameId: string,
    gameTeamId: string,
    halftimeMinute: number,
    periodStartEventId: string,
  ): Promise<number> {
    return this.periodService.linkOrphanSubInsToSecondHalfPeriodStart(
      gameId,
      gameTeamId,
      halftimeMinute,
      periodStartEventId,
    );
  }

  /**
   * Link first half starters to the PERIOD_START period=1 event.
   */
  async linkFirstHalfStartersToPeriodStart(
    gameTeamId: string,
    periodStartEventId: string,
  ): Promise<number> {
    return this.periodService.linkFirstHalfStartersToPeriodStart(
      gameTeamId,
      periodStartEventId,
    );
  }

  // ========================================
  // Event Management Operations (EventManagementService)
  // ========================================

  async recordFormationChange(
    input: RecordFormationChangeInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.eventManagementService.recordFormationChange(
      input,
      recordedByUserId,
    );
  }

  async recordPositionChange(
    input: RecordPositionChangeInput,
    recordedByUserId: string,
  ): Promise<GameEvent> {
    return this.eventManagementService.recordPositionChange(
      input,
      recordedByUserId,
    );
  }

  async swapPositions(
    input: SwapPositionsInput,
    recordedByUserId: string,
  ): Promise<GameEvent[]> {
    return this.eventManagementService.swapPositions(input, recordedByUserId);
  }

  async deletePositionSwap(gameEventId: string): Promise<boolean> {
    return this.eventManagementService.deletePositionSwap(gameEventId);
  }

  async findDependentEvents(
    gameEventId: string,
  ): Promise<DependentEventsResult> {
    return this.eventManagementService.findDependentEvents(gameEventId);
  }

  async deleteEventWithCascade(
    gameEventId: string,
    eventType: 'goal' | 'substitution' | 'position_swap' | 'starter_entry',
  ): Promise<boolean> {
    return this.eventManagementService.deleteEventWithCascade(
      gameEventId,
      eventType,
    );
  }

  async resolveEventConflict(
    conflictId: string,
    selectedEventId: string,
    keepAll?: boolean,
  ): Promise<GameEvent> {
    return this.eventManagementService.resolveEventConflict(
      conflictId,
      selectedEventId,
      keepAll,
    );
  }
}
