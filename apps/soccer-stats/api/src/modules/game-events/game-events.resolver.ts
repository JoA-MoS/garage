import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards, BadRequestException, Inject } from '@nestjs/common';
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
import { SwapPositionsInput } from './dto/swap-positions.input';
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
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  private async getInternalUserId(clerkUser: ClerkUser): Promise<string> {
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      throw new BadRequestException('User email not found');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(
        `No internal user found for email ${email}`
      );
    }

    return user.id;
  }

  @Query(() => GameLineup, { name: 'gameLineup' })
  @Public()
  getGameLineup(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string
  ): Promise<GameLineup> {
    return this.gameEventsService.getGameLineup(gameTeamId);
  }

  @Query(() => [GameEvent], { name: 'gameEvents' })
  @Public()
  getGameEvents(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string
  ): Promise<GameEvent[]> {
    return this.gameEventsService.findEventsByGameTeam(gameTeamId);
  }

  @Query(() => GameEvent, { name: 'gameEvent', nullable: true })
  @Public()
  getGameEvent(
    @Args('id', { type: () => ID }) id: string
  ): Promise<GameEvent | null> {
    return this.gameEventsService.findOne(id);
  }

  @Mutation(() => GameEvent, { name: 'addPlayerToLineup' })
  async addPlayerToLineup(
    @Args('input') input: AddToLineupInput,
    @CurrentUser() clerkUser: ClerkUser
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.addPlayerToLineup(input, userId);
  }

  @Mutation(() => GameEvent, { name: 'addPlayerToBench' })
  async addPlayerToBench(
    @Args('input') input: AddToBenchInput,
    @CurrentUser() clerkUser: ClerkUser
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.addPlayerToBench(input, userId);
  }

  @Mutation(() => Boolean, { name: 'removeFromLineup' })
  @Public() // TODO: Add proper auth
  removeFromLineup(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
  ): Promise<boolean> {
    return this.gameEventsService.removeFromLineup(gameEventId);
  }

  @Mutation(() => GameEvent, { name: 'updatePlayerPosition' })
  @Public() // TODO: Add proper auth
  updatePlayerPosition(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
    @Args('position') position: string
  ): Promise<GameEvent> {
    return this.gameEventsService.updatePlayerPosition(gameEventId, position);
  }

  @Mutation(() => [GameEvent], { name: 'substitutePlayer' })
  async substitutePlayer(
    @Args('input') input: SubstitutePlayerInput,
    @CurrentUser() clerkUser: ClerkUser
  ): Promise<GameEvent[]> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.substitutePlayer(input, userId);
  }

  @Mutation(() => GameEvent, { name: 'recordGoal' })
  async recordGoal(
    @Args('input') input: RecordGoalInput,
    @CurrentUser() clerkUser: ClerkUser
  ): Promise<GameEvent> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.recordGoal(input, userId);
  }

  @Mutation(() => Boolean, { name: 'deleteGoal' })
  @Public() // TODO: Add proper auth
  deleteGoal(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
  ): Promise<boolean> {
    return this.gameEventsService.deleteGoal(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteSubstitution' })
  @Public() // TODO: Add proper auth
  deleteSubstitution(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
  ): Promise<boolean> {
    return this.gameEventsService.deleteSubstitution(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deletePositionSwap' })
  @Public() // TODO: Add proper auth
  deletePositionSwap(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
  ): Promise<boolean> {
    return this.gameEventsService.deletePositionSwap(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteStarterEntry' })
  @Public() // TODO: Add proper auth
  deleteStarterEntry(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
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
    @CurrentUser() clerkUser: ClerkUser
  ): Promise<GameEvent[]> {
    const userId = await this.getInternalUserId(clerkUser);
    return this.gameEventsService.swapPositions(input, userId);
  }

  @Query(() => [PlayerPositionStats], { name: 'playerPositionStats' })
  @Public()
  getPlayerPositionStats(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string
  ): Promise<PlayerPositionStats[]> {
    return this.gameEventsService.getPlayerPositionStats(gameTeamId);
  }

  @Query(() => [PlayerFullStats], { name: 'playerStats' })
  @Public()
  getPlayerStats(
    @Args('input') input: PlayerStatsInput
  ): Promise<PlayerFullStats[]> {
    return this.gameEventsService.getPlayerStats(input);
  }

  @Query(() => DependentEventsResult, { name: 'dependentEvents' })
  @Public()
  getDependentEvents(
    @Args('gameEventId', { type: () => ID }) gameEventId: string
  ): Promise<DependentEventsResult> {
    return this.gameEventsService.findDependentEvents(gameEventId);
  }

  @Mutation(() => Boolean, { name: 'deleteEventWithCascade' })
  @Public() // TODO: Add proper auth
  deleteEventWithCascade(
    @Args('gameEventId', { type: () => ID }) gameEventId: string,
    @Args('eventType') eventType: string
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
          ', '
        )}`
      );
    }
    return this.gameEventsService.deleteEventWithCascade(
      gameEventId,
      eventType as 'goal' | 'substitution' | 'position_swap' | 'starter_entry'
    );
  }

  @Subscription(() => GameEventSubscriptionPayload, {
    name: 'gameEventChanged',
    filter: (
      payload: { gameEventChanged: GameEventSubscriptionPayload },
      variables: { gameId: string }
    ) => payload.gameEventChanged.gameId === variables.gameId,
  })
  @Public()
  gameEventChanged(@Args('gameId', { type: () => ID }) gameId: string) {
    return this.pubSub.asyncIterableIterator(`gameEvent:${gameId}`);
  }
}
