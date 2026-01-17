import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, Inject, BadRequestException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { GameEvent } from '../../entities/game-event.entity';
import { Public } from '../auth/public.decorator';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ClerkUser } from '../auth/clerk.service';
import { UsersService } from '../users/users.service';

import { GameEventsService } from './game-events.service';
import { AddToLineupInput } from './dto/add-to-lineup.input';
import { AddToBenchInput } from './dto/add-to-bench.input';
import { SubstitutePlayerInput } from './dto/substitute-player.input';
import { RecordGoalInput } from './dto/record-goal.input';
import { UpdateGoalInput } from './dto/update-goal.input';
import { RecordFormationChangeInput } from './dto/record-formation-change.input';
import { RecordPositionChangeInput } from './dto/record-position-change.input';
import { SwapPositionsInput } from './dto/swap-positions.input';
import { BatchLineupChangesInput } from './dto/batch-lineup-changes.input';
import { GameLineup } from './dto/game-lineup.output';
import { PlayerPositionStats } from './dto/player-position-stats.output';
import { PlayerFullStats } from './dto/player-full-stats.output';
import { PlayerStatsInput } from './dto/player-stats.input';
import { DependentEventsResult } from './dto/dependent-event.output';
import { GameEventSubscriptionPayload } from './dto/game-event-subscription.output';

@Resolver(() => GameEvent)
@UseGuards(ClerkAuthGuard)
export class GameEventsResolver {
  constructor(
    private readonly gameEventsService: GameEventsService,
    private readonly usersService: UsersService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  /**
   * Converts a Clerk user to internal user ID.
   * Uses JIT provisioning - creates user if not found.
   */
  private async getInternalUserId(clerkUser: ClerkUser): Promise<string> {
    const user = await this.usersService.findOrCreateByClerkUser(clerkUser);
    return user.id;
  }

  @Query(() => GameLineup, { name: 'gameLineup' })
  @Public()
  getGameLineup(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
  ): Promise<GameLineup> {
    return this.gameEventsService.getGameLineup(gameTeamId);
  }

  @Query(() => [GameEvent], { name: 'gameEvents' })
  @Public()
  getGameEvents(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
  ): Promise<GameEvent[]> {
    return this.gameEventsService.findEventsByGameTeam(gameTeamId);
  }

  @Query(() => GameEvent, { name: 'gameEvent', nullable: true })
  @Public()
  getGameEvent(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<GameEvent | null> {
    return this.gameEventsService.findOne(id);
  }

  @Mutation(() => GameEvent, { name: 'addPlayerToLineup' })
  async addPlayerToLineup(
    @Args('input') input: AddToLineupInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.addPlayerToLineup(input, userId);
  }

  @Mutation(() => GameEvent, { name: 'addPlayerToBench' })
  async addPlayerToBench(
    @Args('input') input: AddToBenchInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.addPlayerToBench(input, userId);
  }

  @Mutation(() => Boolean, { name: 'removeFromLineup' })
  @Public() // TODO: Add proper auth
  removeFromLineup(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<boolean> {
    return this.gameEventsService.removeFromLineup(gameEventId);
  }

  @Mutation(() => GameEvent, { name: 'updatePlayerPosition' })
  @Public() // TODO: Add proper auth
  updatePlayerPosition(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
    @Args('position') position: string,
  ): Promise<GameEvent> {
    return this.gameEventsService.updatePlayerPosition(gameEventId, position);
  }

  @Mutation(() => [GameEvent], { name: 'substitutePlayer' })
  async substitutePlayer(
    @Args('input') input: SubstitutePlayerInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent[]> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.substitutePlayer(input, userId);
  }

  @Mutation(() => GameEvent, { name: 'recordGoal' })
  async recordGoal(
    @Args('input') input: RecordGoalInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.recordGoal(input, userId);
  }

  @Mutation(() => GameEvent, {
    name: 'recordFormationChange',
    description: 'Record a formation change event during a game',
  })
  async recordFormationChange(
    @Args('input') input: RecordFormationChangeInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.recordFormationChange(input, userId);
  }

  @Mutation(() => GameEvent, {
    name: 'recordPositionChange',
    description:
      'Record a position change event during a game for accurate position-time tracking',
  })
  async recordPositionChange(
    @Args('input') input: RecordPositionChangeInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.recordPositionChange(input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  @Public() // TODO: Add proper auth
  deleteGoal(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<boolean> {
    return this.gameEventsService.deleteGoal(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteSubstitution' })
  @Public() // TODO: Add proper auth
  deleteSubstitution(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<boolean> {
    return this.gameEventsService.deleteSubstitution(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deletePositionSwap' })
  @Public() // TODO: Add proper auth
  deletePositionSwap(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<boolean> {
    return this.gameEventsService.deletePositionSwap(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteStarterEntry' })
  @Public() // TODO: Add proper auth
  deleteStarterEntry(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<boolean> {
    return this.gameEventsService.deleteStarterEntry(gameEventId);
  }

  @Mutation(() => GameEvent, { name: 'updateGoal' })
  @Public() // TODO: Add proper auth
  updateGoal(@Args('input') input: UpdateGoalInput): Promise<GameEvent> {
    return this.gameEventsService.updateGoal(input);
  }

  @Mutation(() => [GameEvent], { name: 'swapPositions' })
  async swapPositions(
    @Args('input') input: SwapPositionsInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent[]> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.swapPositions(input, userId);
  }

  @Mutation(() => [GameEvent], {
    name: 'batchLineupChanges',
    description:
      'Process multiple lineup changes (substitutions and swaps) in a single request',
  })
  async batchLineupChanges(
    @Args('input') input: BatchLineupChangesInput,
    @CurrentUser() clerkUser: ClerkUser,
  ): Promise<GameEvent[]> {
    const userId = await this.getInternalUserId(clerkUser);
    const result = await this.gameEventsService.batchLineupChanges(
      input,
      userId,
    );
    return result.events;
  }

  @Query(() => [PlayerPositionStats], { name: 'playerPositionStats' })
  @Public()
  getPlayerPositionStats(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
  ): Promise<PlayerPositionStats[]> {
    return this.gameEventsService.getPlayerPositionStats(gameTeamId);
  }

  @Query(() => [PlayerFullStats], { name: 'playerStats' })
  @Public()
  getPlayerStats(
    @Args('input') input: PlayerStatsInput,
  ): Promise<PlayerFullStats[]> {
    return this.gameEventsService.getPlayerStats(input);
  }

  @Query(() => DependentEventsResult, { name: 'dependentEvents' })
  @Public()
  getDependentEvents(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
  ): Promise<DependentEventsResult> {
    return this.gameEventsService.findDependentEvents(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteEventWithCascade' })
  @Public() // TODO: Add proper auth
  deleteEventWithCascade(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
    @Args('eventType') eventType: string,
  ): Promise<boolean> {
    const validTypes = [
      'goal',
      'substitution',
      'position_swap',
      'starter_entry',
    ];
    if (!validTypes.includes(eventType)) {
      throw new BadRequestException(
        `Invalid event type: ${eventType}. Must be one of: ${validTypes.join(
          ', ',
        )}`,
      );
    }
    return this.gameEventsService.deleteEventWithCascade(
      gameEventId,
      eventType as 'goal' | 'substitution' | 'position_swap' | 'starter_entry',
    );
  }

  @Mutation(() => GameEvent, { name: 'resolveEventConflict' })
  @Public() // TODO: Add proper auth
  resolveEventConflict(
    @Args('conflictId', { type: () => ID }) conflictId: string,
    @Args('selectedEventId', { type: () => ID }) selectedEventId: string,
    @Args('keepAll', { nullable: true }) keepAll?: boolean,
  ): Promise<GameEvent> {
    return this.gameEventsService.resolveEventConflict(
      conflictId,
      selectedEventId,
      keepAll,
    );
  }

  @Subscription(() => GameEventSubscriptionPayload, {
    name: 'gameEventChanged',
    filter: (
      payload: { gameEventChanged: GameEventSubscriptionPayload },
      variables: { gameId: string },
    ) => payload.gameEventChanged.gameId === variables.gameId,
  })
  @Public()
  gameEventChanged(@Args('gameId', { type: () => ID }) gameId: string) {
    return this.pubSub.asyncIterableIterator(`gameEvent:${gameId}`);
  }

  /**
   * Computed field: extracts period from metadata for timing events.
   * Returns the period identifier (e.g., "1", "2", "OT1") for PERIOD_START/PERIOD_END events.
   * Returns null for all other event types.
   */
  @ResolveField(() => String, { nullable: true })
  period(@Parent() event: GameEvent): string | null {
    const metadata = event.metadata as { period?: string } | null;
    return metadata?.period ?? null;
  }
}
