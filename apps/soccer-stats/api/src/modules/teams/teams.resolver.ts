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

import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { User } from '../../entities/user.entity';
import { PlayersService } from '../players/players.service';

import { TeamPlayerWithJersey } from './dto/team-player-with-jersey.dto';
import { TeamsService } from './teams.service';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  @Query(() => [Team], { name: 'teams' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Query(() => Team, { name: 'team' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.teamsService.findOne(id);
  }

  @Query(() => [Team], { name: 'teamsByName' })
  findByName(@Args('name') name: string) {
    return this.teamsService.findByName(name);
  }

  @ResolveField(() => [User])
  players(@Parent() team: Team): Promise<User[]> {
    return this.teamsService.getPlayersForTeam(team.id);
  }

  @ResolveField(() => [TeamPlayerWithJersey])
  playersWithJersey(@Parent() team: Team): Promise<TeamPlayerWithJersey[]> {
    return this.teamsService.getPlayersWithJersey(team.id);
  }

  @ResolveField(() => [GameTeam])
  gameTeams(@Parent() team: Team): Promise<GameTeam[]> {
    return this.teamsService.getGameTeams(team.id);
  }

  @Mutation(() => Team)
  async createTeam(@Args('createTeamInput') createTeamInput: CreateTeamInput) {
    const team = await this.teamsService.create(createTeamInput);
    this.pubSub.publish('teamCreated', { teamCreated: team });
    return team;
  }

  @Mutation(() => Team)
  async updateTeam(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTeamInput') updateTeamInput: UpdateTeamInput
  ) {
    const team = await this.teamsService.update(id, updateTeamInput);
    this.pubSub.publish('teamUpdated', { teamUpdated: team });
    return team;
  }

  @Mutation(() => Boolean)
  removeTeam(@Args('id', { type: () => ID }) id: string) {
    return this.teamsService.remove(id);
  }

  @Mutation(() => Team)
  async addPlayerToTeam(
    @Args('addPlayerToTeamInput') addPlayerToTeamInput: AddPlayerToTeamInput
  ) {
    return this.teamsService.addPlayerToTeam(addPlayerToTeamInput);
  }

  @Mutation(() => Team)
  async removePlayerFromTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('playerId', { type: () => ID }) playerId: string
  ) {
    return this.teamsService.removePlayerFromTeam(teamId, playerId);
  }

  @Subscription(() => Team, {
    name: 'teamUpdated',
  })
  teamUpdated() {
    return this.pubSub.asyncIterableIterator('teamUpdated');
  }

  @Subscription(() => Team, {
    name: 'teamCreated',
  })
  teamCreated() {
    return this.pubSub.asyncIterableIterator('teamCreated');
  }
}
