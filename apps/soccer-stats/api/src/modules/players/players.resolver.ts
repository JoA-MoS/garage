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
import { Inject } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { Player } from '../../entities/player.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameParticipation } from '../../entities/game-participation.entity';
import { Team } from '../../entities/team.entity';
import { TeamsService } from '../teams/teams.service';

import { PlayersService } from './players.service';
import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

@Resolver(() => Player)
export class PlayersResolver {
  constructor(
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  @Query(() => [Player], { name: 'players' })
  findAll() {
    return this.playersService.findAll();
  }

  @Query(() => Player, { name: 'player' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.playersService.findOne(id);
  }

  @Query(() => [Player], { name: 'playersByPosition' })
  findByPosition(@Args('position') position: string) {
    return this.playersService.findByPosition(position);
  }

  @Query(() => [Player], { name: 'playersByName' })
  findByName(@Args('name') name: string) {
    return this.playersService.findByName(name);
  }

  @ResolveField(() => [Team])
  teams(@Parent() player: Player): Promise<Team[]> {
    return this.teamsService.findByPlayerId(player.id);
  }

  @ResolveField(() => [TeamPlayer])
  teamPlayers(@Parent() player: Player): Promise<TeamPlayer[]> {
    return this.playersService.getTeamPlayers(player.id);
  }

  @ResolveField(() => [GameParticipation])
  participations(@Parent() player: Player): Promise<GameParticipation[]> {
    return this.playersService.getParticipations(player.id);
  }

  @Mutation(() => Player)
  async createPlayer(
    @Args('createPlayerInput') createPlayerInput: CreatePlayerInput
  ) {
    const player = await this.playersService.create(createPlayerInput);
    this.pubSub.publish('playerCreated', { playerCreated: player });
    return player;
  }

  @Mutation(() => Player)
  async updatePlayer(
    @Args('id', { type: () => ID }) id: string,
    @Args('updatePlayerInput') updatePlayerInput: UpdatePlayerInput
  ) {
    const player = await this.playersService.update(id, updatePlayerInput);
    this.pubSub.publish('playerUpdated', { playerUpdated: player });
    return player;
  }

  @Mutation(() => Boolean)
  removePlayer(@Args('id', { type: () => ID }) id: string) {
    return this.playersService.remove(id);
  }

  @Subscription(() => Player, {
    name: 'playerUpdated',
  })
  playerUpdated() {
    return this.pubSub.asyncIterableIterator('playerUpdated');
  }

  @Subscription(() => Player, {
    name: 'playerCreated',
  })
  playerCreated() {
    return this.pubSub.asyncIterableIterator('playerCreated');
  }
}
