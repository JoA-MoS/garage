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

import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { Team } from '../../entities/team.entity';
import { TeamsService } from '../teams/teams.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

import { UsersService, UserType } from './users.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
@UseGuards(ClerkAuthGuard)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly teamsService: TeamsService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  // General user queries
  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll(UserType.ALL);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => [User], { name: 'usersByName' })
  findByName(@Args('name') name: string) {
    return this.usersService.findByName(name, UserType.ALL);
  }

  @Query(() => [User], { name: 'usersByTeam' })
  findByTeam(@Args('teamId', { type: () => ID }) teamId: string) {
    return this.usersService.findByTeam(teamId, UserType.ALL);
  }

  // Player-specific queries
  @Query(() => [User], { name: 'players' })
  findAllPlayers() {
    return this.usersService.findAll(UserType.PLAYER);
  }

  @Query(() => [User], { name: 'playersByName' })
  findPlayersByName(@Args('name') name: string) {
    return this.usersService.findByName(name, UserType.PLAYER);
  }

  @Query(() => [User], { name: 'playersByPosition' })
  findByPosition(@Args('position') position: string) {
    return this.usersService.findByPosition(position);
  }

  @Query(() => [User], { name: 'playersByTeam' })
  findPlayersByTeam(@Args('teamId', { type: () => ID }) teamId: string) {
    return this.usersService.findByTeam(teamId, UserType.PLAYER);
  }

  // Coach-specific queries
  @Query(() => [User], { name: 'coaches' })
  findAllCoaches() {
    return this.usersService.findAll(UserType.COACH);
  }

  @Query(() => [User], { name: 'coachesByName' })
  findCoachesByName(@Args('name') name: string) {
    return this.usersService.findByName(name, UserType.COACH);
  }

  @Query(() => [User], { name: 'coachesByRole' })
  findByCoachRole(@Args('role') role: string) {
    return this.usersService.findByCoachRole(role);
  }

  @Query(() => [User], { name: 'coachesByTeam' })
  findCoachesByTeam(@Args('teamId', { type: () => ID }) teamId: string) {
    return this.usersService.findByTeam(teamId, UserType.COACH);
  }

  // Resolve fields for relationships
  @ResolveField(() => [Team])
  async teams(@Parent() user: User): Promise<Team[]> {
    // Get teams where user is either a player or coach
    const playerTeams = await this.teamsService.findByPlayerId(user.id);
    const coachTeams = await this.teamsService.findByCoachId(user.id);

    // Combine and deduplicate teams
    const allTeams = [...playerTeams, ...coachTeams];
    const uniqueTeams = allTeams.filter(
      (team, index, arr) => arr.findIndex((t) => t.id === team.id) === index,
    );

    return uniqueTeams;
  }

  // General user mutations
  @Mutation(() => User)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    const user = await this.usersService.create(createUserInput);
    this.pubSub.publish('userCreated', { userCreated: user });
    return user;
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    const user = await this.usersService.update(id, updateUserInput);
    this.pubSub.publish('userUpdated', { userUpdated: user });
    return user;
  }

  @Mutation(() => Boolean)
  removeUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }

  // Player relationship mutations
  @Mutation(() => TeamMember)
  addPlayerToTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('jerseyNumber', { nullable: true }) jerseyNumber?: string,
    @Args('primaryPosition', { nullable: true }) primaryPosition?: string,
  ): Promise<TeamMember> {
    return this.usersService.addPlayerToTeam(
      userId,
      teamId,
      jerseyNumber,
      primaryPosition,
    );
  }

  @Mutation(() => Boolean)
  removePlayerFromTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
  ): Promise<boolean> {
    return this.usersService.removePlayerFromTeam(userId, teamId);
  }

  // Coach relationship mutations
  @Mutation(() => TeamMember)
  addCoachToTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('coachTitle') coachTitle: string,
    @Args('isGuest', { nullable: true, defaultValue: false }) isGuest?: boolean,
  ): Promise<TeamMember> {
    return this.usersService.addCoachToTeam(
      userId,
      teamId,
      coachTitle,
      isGuest,
    );
  }

  @Mutation(() => Boolean)
  removeCoachFromTeam(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('teamId', { type: () => ID }) teamId: string,
  ): Promise<boolean> {
    return this.usersService.removeCoachFromTeam(userId, teamId);
  }

  // Subscriptions
  @Subscription(() => User, { name: 'userUpdated' })
  userUpdated() {
    return this.pubSub.asyncIterableIterator('userUpdated');
  }

  @Subscription(() => User, { name: 'userCreated' })
  userCreated() {
    return this.pubSub.asyncIterableIterator('userCreated');
  }
}
