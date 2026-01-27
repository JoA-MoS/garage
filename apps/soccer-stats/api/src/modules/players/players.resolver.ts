import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { User } from '../../entities/user.entity';

import { PlayersService } from './players.service';
import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

/**
 * Resolver for player-related queries and mutations.
 * For team membership operations, use TeamMembersResolver.
 */
@Resolver(() => User)
export class PlayersResolver {
  constructor(
    private readonly playersService: PlayersService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  @Query(() => [User], { name: 'players' })
  findAll() {
    return this.playersService.findAll();
  }

  @Query(() => User, { name: 'player' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.playersService.findOne(id);
  }

  @Query(() => [User], { name: 'playersByPosition' })
  findByPosition(@Args('position') position: string) {
    return this.playersService.findByPosition(position);
  }

  @Query(() => [User], { name: 'playersByName' })
  findByName(@Args('name') name: string) {
    return this.playersService.findByName(name);
  }

  // Note: 'teams' and 'teamMemberships' fields are resolved by UserFieldsResolver
  // using DataLoaders for batched queries.

  @Mutation(() => User)
  async createPlayer(
    @Args('createPlayerInput') createPlayerInput: CreatePlayerInput,
  ) {
    const player = await this.playersService.create(createPlayerInput);
    this.pubSub.publish('playerCreated', { playerCreated: player });
    return player;
  }

  @Mutation(() => User)
  async updatePlayer(
    @Args('id', { type: () => ID }) id: string,
    @Args('updatePlayerInput') updatePlayerInput: UpdatePlayerInput,
  ) {
    const player = await this.playersService.update(id, updatePlayerInput);
    this.pubSub.publish('playerUpdated', { playerUpdated: player });
    return player;
  }

  @Mutation(() => Boolean)
  removePlayer(@Args('id', { type: () => ID }) id: string) {
    return this.playersService.remove(id);
  }

  @Subscription(() => User, {
    name: 'playerUpdated',
  })
  playerUpdated() {
    return this.pubSub.asyncIterableIterator('playerUpdated');
  }

  @Subscription(() => User, {
    name: 'playerCreated',
  })
  playerCreated() {
    return this.pubSub.asyncIterableIterator('playerCreated');
  }
}
