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
import { Inject, UseGuards } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { Team } from '../../entities/team.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { TeamAccessGuard } from '../auth/team-access.guard';
import { RequireTeamRole } from '../auth/require-team-role.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { GameTeam } from '../../entities/game-team.entity';
import { TeamMembersService } from '../team-members/team-members.service';

import { TeamPlayerWithJersey } from './dto/team-player-with-jersey.dto';
import { TeamsService } from './teams.service';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';
import { UpgradeTeamInput } from './dto/upgrade-team.input';
import { UpdateTeamConfigurationInput } from './dto/update-team-configuration.input';

@Resolver(() => Team)
export class TeamsResolver {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly teamMembersService: TeamMembersService,
    @Inject('PUB_SUB') private pubSub: PubSub,
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

  @Query(() => [Team], { name: 'managedTeams' })
  findManagedTeams() {
    return this.teamsService.findManagedTeams();
  }

  @Query(() => [Team], { name: 'unmanagedTeams' })
  findUnmanagedTeams() {
    return this.teamsService.findUnmanagedTeams();
  }

  @Query(() => [Team], { name: 'teamsByManagedStatus' })
  findByManagedStatus(@Args('isManaged') isManaged: boolean) {
    return this.teamsService.findByManagedStatus(isManaged);
  }

  @Query(() => [Team], {
    name: 'myTeams',
    description: 'Get teams the current user has access to via team membership',
  })
  @UseGuards(ClerkAuthGuard)
  findMyTeams(@CurrentUser() user: AuthenticatedUser) {
    // Use internal user ID to find teams via team_members relationship
    return this.teamMembersService.findTeamsForUser(user.id);
  }

  // Note: 'players' and 'teamPlayers' fields are resolved by TeamFieldsResolver
  // using DataLoaders for batched queries.

  @ResolveField(() => [TeamPlayerWithJersey])
  playersWithJersey(@Parent() team: Team): Promise<TeamPlayerWithJersey[]> {
    return this.teamsService.getPlayersWithJersey(team.id);
  }

  @ResolveField(() => [GameTeam])
  gameTeams(@Parent() team: Team): Promise<GameTeam[]> {
    return this.teamsService.getGameTeams(team.id);
  }

  @ResolveField(() => TeamMember, {
    nullable: true,
    description: 'The owner of the team (TeamMember with OWNER role)',
  })
  owner(@Parent() team: Team): Promise<TeamMember | null> {
    return this.teamMembersService.findTeamOwner(team.id);
  }

  @ResolveField(() => TeamConfiguration, {
    nullable: true,
    description: 'Team configuration settings (defaults for games)',
  })
  teamConfiguration(@Parent() team: Team): Promise<TeamConfiguration | null> {
    return this.teamsService.getTeamConfiguration(team.id);
  }

  @Mutation(() => Team)
  @UseGuards(ClerkAuthGuard)
  async createTeam(
    @Args('createTeamInput') createTeamInput: CreateTeamInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Use both clerkId (for createdById legacy field) and internal ID (for ownership)
    const team = await this.teamsService.create(
      createTeamInput,
      user.clerkId,
      user.id,
    );
    this.pubSub.publish('teamCreated', { teamCreated: team });
    return team;
  }

  @Mutation(() => Team)
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER], { teamIdArg: 'id' })
  async updateTeam(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTeamInput') updateTeamInput: UpdateTeamInput,
  ) {
    const team = await this.teamsService.update(id, updateTeamInput);
    this.pubSub.publish('teamUpdated', { teamUpdated: team });
    return team;
  }

  @Mutation(() => Boolean)
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER], { teamIdArg: 'id' })
  removeTeam(@Args('id', { type: () => ID }) id: string) {
    return this.teamsService.remove(id);
  }

  @Mutation(() => Team)
  async createUnmanagedTeam(
    @Args('name') name: string,
    @Args('shortName', { nullable: true }) shortName?: string,
  ) {
    return this.teamsService.createUnmanagedTeam(name, shortName);
  }

  @Mutation(() => Team)
  async findOrCreateUnmanagedTeam(
    @Args('name') name: string,
    @Args('shortName', { nullable: true }) shortName?: string,
  ) {
    return this.teamsService.findOrCreateUnmanagedTeam(name, shortName);
  }

  @Mutation(() => Team)
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER], { teamIdArg: 'id' })
  async upgradeToManagedTeam(
    @Args('id', { type: () => ID }) id: string,
    @Args('upgradeTeamInput') upgradeTeamInput: UpgradeTeamInput,
  ) {
    return this.teamsService.upgradeToManagedTeam(id, upgradeTeamInput);
  }

  @Mutation(() => Team)
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER, TeamRole.COACH], {
    teamIdPath: 'addPlayerToTeamInput.teamId',
  })
  async addPlayerToTeam(
    @Args('addPlayerToTeamInput') addPlayerToTeamInput: AddPlayerToTeamInput,
  ) {
    return this.teamsService.addPlayerToTeam(addPlayerToTeamInput);
  }

  @Mutation(() => Team)
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER, TeamRole.COACH])
  async removePlayerFromTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('playerId', { type: () => ID }) playerId: string,
  ) {
    return this.teamsService.removePlayerFromTeam(teamId, playerId);
  }

  @Mutation(() => [Team], {
    name: 'backfillMyTeamOwners',
    description:
      'Backfill ownership for teams created by the current user that do not have an owner. Returns the list of teams that were updated.',
  })
  @UseGuards(ClerkAuthGuard)
  async backfillMyTeamOwners(@CurrentUser() user: AuthenticatedUser) {
    return this.teamsService.backfillOwnersForUser(user.clerkId, user.id);
  }

  @Mutation(() => TeamConfiguration, {
    description:
      'Update team configuration settings (defaults for stats tracking, formation, lineup)',
  })
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER], { teamIdArg: 'teamId' })
  async updateTeamConfiguration(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('input') input: UpdateTeamConfigurationInput,
  ): Promise<TeamConfiguration> {
    return this.teamsService.updateTeamConfiguration(teamId, input);
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
