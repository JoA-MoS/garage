import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards, Inject, BadRequestException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { GameEvent } from '../../entities/game-event.entity';
import { Public } from '../auth/public.decorator';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.type';

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
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

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
  addPlayerToLineup(
    @Args('input') input: AddToLineupInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent> {
    return this.gameEventsService.addPlayerToLineup(input, user.id);
  }

  @Mutation(() => GameEvent, { name: 'addPlayerToBench' })
  addPlayerToBench(
    @Args('input') input: AddToBenchInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent> {
    return this.gameEventsService.addPlayerToBench(input, user.id);
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
  substitutePlayer(
    @Args('input') input: SubstitutePlayerInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent[]> {
    return this.gameEventsService.substitutePlayer(input, user.id);
  }

  @Mutation(() => GameEvent, { name: 'recordGoal' })
  recordGoal(
    @Args('input') input: RecordGoalInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent> {
    return this.gameEventsService.recordGoal(input, user.id);
  }

  @Mutation(() => GameEvent, {
    name: 'recordFormationChange',
    description: 'Record a formation change event during a game',
  })
  recordFormationChange(
    @Args('input') input: RecordFormationChangeInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent> {
    return this.gameEventsService.recordFormationChange(input, user.id);
  }

  @Mutation(() => GameEvent, {
    name: 'recordPositionChange',
    description:
      'Record a position change event during a game for accurate position-time tracking',
  })
  recordPositionChange(
    @Args('input') input: RecordPositionChangeInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent> {
    return this.gameEventsService.recordPositionChange(input, user.id);
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
  swapPositions(
    @Args('input') input: SwapPositionsInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent[]> {
    return this.gameEventsService.swapPositions(input, user.id);
  }

  @Mutation(() => [GameEvent], {
    name: 'batchLineupChanges',
    description:
      'Process multiple lineup changes (substitutions and swaps) in a single request',
  })
  async batchLineupChanges(
    @Args('input') input: BatchLineupChangesInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GameEvent[]> {
    const result = await this.gameEventsService.batchLineupChanges(
      input,
      user.id,
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

  // Note: The `period` field is now a computed getter on the GameEvent entity itself,
  // so no @ResolveField is needed here. See GameEvent.period getter.
}
