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
import { Inject, UseGuards, ForbiddenException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { Player } from '../../entities/player.entity';
import { TeamRole } from '../../entities/user-team-role.entity';
import { PlayersService } from '../players/players.service';
import { UsersService } from '../users/users.service';

import { TeamsService } from './teams.service';
import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';
import { ClerkAuthGuard } from '../../app/guards/clerk-auth.guard';
import { CurrentUser } from '../../app/decorators/current-user.decorator';

@Resolver(() => Team)
@UseGuards(ClerkAuthGuard)
export class TeamsResolver {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly playersService: PlayersService,
    private readonly usersService: UsersService,
    @Inject('PUB_SUB') private pubSub: PubSub
  ) {}

  @Query(() => [Team], { name: 'teams' })
  async findAll(@CurrentUser() clerkUser: any) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      return [];
    }

    // Return only teams that the user has access to
    return this.usersService.getUserTeams(user.id);
  }

  @Query(() => Team, { name: 'team' })
  async findOne(@Args('id', { type: () => ID }) id: string, @CurrentUser() clerkUser: any) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has access to this team
    const userRole = await this.usersService.getUserRole(user.id, id);
    if (!userRole) {
      throw new ForbiddenException('Access denied to this team');
    }

    return this.teamsService.findOne(id);
  }

  @Query(() => [Team], { name: 'teamsByName' })
  async findByName(@Args('name') name: string, @CurrentUser() clerkUser: any) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      return [];
    }

    const userTeams = await this.usersService.getUserTeams(user.id);
    const teams = await this.teamsService.findByName(name);
    
    // Filter teams to only include those the user has access to
    return teams.filter(team => userTeams.some(userTeam => userTeam.id === team.id));
  }

  @ResolveField(() => [Player])
  players(@Parent() team: Team): Promise<Player[]> {
    return this.playersService.findByTeamId(team.id);
  }

  @ResolveField(() => [GameTeam])
  gameTeams(@Parent() team: Team): Promise<GameTeam[]> {
    return this.teamsService.getGameTeams(team.id);
  }

  @Mutation(() => Team)
  async createTeam(
    @Args('createTeamInput') createTeamInput: CreateTeamInput,
    @CurrentUser() clerkUser: any
  ) {
    const user = await this.usersService.findOrCreateUser({
      clerkId: clerkUser.sub,
      email: clerkUser.email || clerkUser.email_addresses?.[0]?.email_address,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
      profileImageUrl: clerkUser.image_url,
    });

    const team = await this.teamsService.create(createTeamInput);
    
    // Automatically add the creator as an admin
    await this.usersService.addUserToTeam(user.id, team.id, TeamRole.ADMIN);
    
    this.pubSub.publish('teamCreated', { teamCreated: team });
    return team;
  }

  @Mutation(() => Team)
  async updateTeam(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTeamInput') updateTeamInput: UpdateTeamInput,
    @CurrentUser() clerkUser: any
  ) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has coach+ permissions
    const userRole = await this.usersService.getUserRole(user.id, id);
    if (!userRole || !this.usersService.hasPermission(userRole, TeamRole.COACH)) {
      throw new ForbiddenException('Insufficient permissions to update team');
    }

    const team = await this.teamsService.update(id, updateTeamInput);
    this.pubSub.publish('teamUpdated', { teamUpdated: team });
    return team;
  }

  @Mutation(() => Boolean)
  async removeTeam(@Args('id', { type: () => ID }) id: string, @CurrentUser() clerkUser: any) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has admin permissions
    const userRole = await this.usersService.getUserRole(user.id, id);
    if (!userRole || !this.usersService.hasPermission(userRole, TeamRole.ADMIN)) {
      throw new ForbiddenException('Insufficient permissions to delete team');
    }

    return this.teamsService.remove(id);
  }

  @Mutation(() => Team)
  async addPlayerToTeam(
    @Args('addPlayerToTeamInput') addPlayerToTeamInput: AddPlayerToTeamInput,
    @CurrentUser() clerkUser: any
  ) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has coach+ permissions
    const userRole = await this.usersService.getUserRole(user.id, addPlayerToTeamInput.teamId);
    if (!userRole || !this.usersService.hasPermission(userRole, TeamRole.COACH)) {
      throw new ForbiddenException('Insufficient permissions to manage players');
    }

    return this.teamsService.addPlayerToTeam(addPlayerToTeamInput);
  }

  @Mutation(() => Team)
  async removePlayerFromTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('playerId', { type: () => ID }) playerId: string,
    @CurrentUser() clerkUser: any
  ) {
    const user = await this.usersService.findByClerkId(clerkUser.sub);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has coach+ permissions
    const userRole = await this.usersService.getUserRole(user.id, teamId);
    if (!userRole || !this.usersService.hasPermission(userRole, TeamRole.COACH)) {
      throw new ForbiddenException('Insufficient permissions to manage players');
    }

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
