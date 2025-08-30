import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { Game } from '../../entities/game.entity';

import { GamesService } from './games.service';
import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';

@Resolver(() => Game)
export class GamesResolver {
  constructor(
    private readonly gamesService: GamesService,
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  @Query(() => [Game], { name: 'games' })
  findAll() {
    return this.gamesService.findAll();
  }

  @Query(() => Game, { name: 'game' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.findOne(id);
  }

  @Mutation(() => Game)
  async createGame(@Args('createGameInput') createGameInput: CreateGameInput) {
    const game = await this.gamesService.create(createGameInput);
    this.pubSub.publish('gameCreated', { gameCreated: game });
    return game;
  }

  @Mutation(() => Game)
  async updateGame(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateGameInput') updateGameInput: UpdateGameInput
  ) {
    const game = await this.gamesService.update(id, updateGameInput);
    this.pubSub.publish('gameUpdated', { gameUpdated: game });
    return game;
  }

  @Mutation(() => Boolean)
  removeGame(@Args('id', { type: () => ID }) id: string) {
    return this.gamesService.remove(id);
  }

  @Mutation(() => Game)
  async startGame(@Args('id', { type: () => ID }) id: string) {
    const game = await this.gamesService.startGame(id);
    this.pubSub.publish('gameUpdated', { gameUpdated: game });
    return game;
  }

  @Mutation(() => Game)
  async pauseGame(@Args('id', { type: () => ID }) id: string) {
    const game = await this.gamesService.pauseGame(id);
    this.pubSub.publish('gameUpdated', { gameUpdated: game });
    return game;
  }

  @Mutation(() => Game)
  async endGame(@Args('id', { type: () => ID }) id: string) {
    const game = await this.gamesService.endGame(id);
    this.pubSub.publish('gameUpdated', { gameUpdated: game });
    return game;
  }

  @Mutation(() => Game)
  async updateGameTime(
    @Args('id', { type: () => ID }) id: string,
    @Args('currentTime', { type: () => Int }) currentTime: number
  ) {
    const game = await this.gamesService.updateGameTime(id, currentTime);
    this.pubSub.publish('gameUpdated', { gameUpdated: game });
    return game;
  }

  @Subscription(() => Game, {
    name: 'gameUpdated',
  })
  gameUpdated() {
    return this.pubSub.asyncIterableIterator('gameUpdated');
  }

  @Subscription(() => Game, {
    name: 'gameCreated',
  })
  gameCreated() {
    return this.pubSub.asyncIterableIterator('gameCreated');
  }
}
