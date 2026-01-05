import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
} from '@nestjs/graphql';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { Game } from '../../entities/game.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { Public } from '../auth/public.decorator';
import { ClerkUser } from '../auth/clerk.service';

import { GamesService } from './games.service';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';
import { UpdateGameTeamInput } from './dto/update-game-team.input';

@Resolver(() => Game)
@UseGuards(ClerkAuthGuard)
export class GamesResolver {
  private readonly logger = new Logger(GamesResolver.name);

  constructor(
    private readonly gamesService: GamesService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  @Query(() => [Game], { name: 'games' })
  @Public() // Public endpoint - no auth required
  findAll() {
    return this.gamesService.findAll();
  }

  @Query(() => Game, { name: 'game' })
  @Public() // Public endpoint
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.findOne(id);
  }

  @Mutation(() => Game)
  @Public() // TODO(#186): Restore auth guard after MVP
  async createGame(@Args('createGameInput') createGameInput: CreateGameInput) {
    this.logger.log(
      `Creating game with input: ${JSON.stringify(createGameInput)}`,
    );
    const game = await this.gamesService.create(createGameInput);
    try {
      await this.pubSub.publish('gameCreated', { gameCreated: game });
    } catch (error) {
      this.logger.error('Failed to publish gameCreated event', {
        error,
        gameId: game.id,
      });
    }
    return game;
  }

  @Mutation(() => Game)
  async updateGame(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateGameInput') updateGameInput: UpdateGameInput,
    @CurrentUser() user: ClerkUser,
  ) {
    this.logger.log(`Updating game ${id} for user: ${user.id}`);
    const game = await this.gamesService.update(id, updateGameInput);
    try {
      await this.pubSub.publish('gameUpdated', { gameUpdated: game });
    } catch (error) {
      this.logger.error('Failed to publish gameUpdated event', {
        error,
        gameId: game.id,
      });
    }
    return game;
  }

  @Mutation(() => Boolean)
  removeGame(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.remove(id);
  }

  @Mutation(() => GameTeam, {
    description: 'Update game team settings (formation, stats tracking level)',
  })
  @Public() // TODO(#186): Restore auth guard after MVP
  async updateGameTeam(
    @Args('gameTeamId', { type: () => ID }) gameTeamId: string,
    @Args('updateGameTeamInput') updateGameTeamInput: UpdateGameTeamInput,
  ) {
    const gameTeam = await this.gamesService.updateGameTeam(
      gameTeamId,
      updateGameTeamInput,
    );
    // Optionally publish an event for real-time updates
    // this.pubSub.publish('gameTeamUpdated', { gameTeamUpdated: gameTeam });
    return gameTeam;
  }

  @Subscription(() => Game, {
    name: 'gameUpdated',
    filter: (payload: { gameUpdated: Game }, variables: { gameId: string }) =>
      payload.gameUpdated.id === variables.gameId,
  })
  @Public()
  gameUpdated(@Args('gameId', { type: () => ID }) _gameId: string) {
    return this.pubSub.asyncIterableIterator('gameUpdated');
  }

  @Subscription(() => Game, {
    name: 'gameCreated',
  })
  gameCreated() {
    return this.pubSub.asyncIterableIterator('gameCreated');
  }
}
