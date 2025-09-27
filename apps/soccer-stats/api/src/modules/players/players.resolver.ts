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

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { Team } from '../../entities/team.entity';
import { TeamsService } from '../teams/teams.service';

import { PlayersService } from './players.service';
import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

@Resolver(() => User)
export class PlayersResolver {
  constructor(
    private readonly playersService: PlayersService,
    private readonly teamsService: TeamsService,
    @Inject('PUB_SUB') private pubSub: PubSub
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

  @ResolveField(() => [Team])
  teams(@Parent() player: User): Promise<Team[]> {
    return this.teamsService.findByPlayerId(player.id);
  }

  @ResolveField(() => [TeamPlayer])
  teamPlayers(@Parent() player: User): Promise<TeamPlayer[]> {
    return this.playersService.getTeamPlayers(player.id);
  }

  @Mutation(() => User)
  async createPlayer(
    @Args('createPlayerInput') createPlayerInput: CreatePlayerInput
  ) {
    const player = await this.playersService.create(createPlayerInput);
    this.pubSub.publish('playerCreated', { playerCreated: player });
    return player;
  }

  @Mutation(() => User)
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

  @Mutation(() => TeamPlayer)
  addPlayerToTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('jerseyNumber', { nullable: true }) jerseyNumber?: string,
    @Args('primaryPosition', { nullable: true }) primaryPosition?: string,
    @Args('joinedDate', { nullable: true }) joinedDate?: Date
  ) {
    return this.playersService.addPlayerToTeam(
      userId,
      teamId,
      jerseyNumber,
      primaryPosition,
      joinedDate
    );
  }

  @Mutation(() => Boolean)
  removePlayerFromTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('leftDate', { nullable: true }) leftDate?: Date
  ) {
    return this.playersService.removePlayerFromTeam(userId, teamId, leftDate);
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
