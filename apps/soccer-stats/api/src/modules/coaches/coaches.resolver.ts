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
import { Team } from '../../entities/team.entity';
import { TeamsService } from '../teams/teams.service';

import { CoachesService } from './coaches.service';
import { CreateCoachInput } from './dto/create-coach.input';
import { UpdateCoachInput } from './dto/update-coach.input';

/**
 * Resolver for coach-related queries and mutations.
 * For team membership operations, use TeamMembersResolver.
 */
@Resolver(() => User)
export class CoachesResolver {
  constructor(
    private readonly coachesService: CoachesService,
    private readonly teamsService: TeamsService,
    @Inject('PUB_SUB') private pubSub: PubSub,
  ) {}

  @Query(() => [User], { name: 'coaches' })
  findAll() {
    return this.coachesService.findAll();
  }

  @Query(() => User, { name: 'coach' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.coachesService.findOne(id);
  }

  @Query(() => [User], { name: 'coachesByRole' })
  findByRole(@Args('role') role: string) {
    return this.coachesService.findByRole(role);
  }

  @Query(() => [User], { name: 'coachesByName' })
  findByName(@Args('name') name: string) {
    return this.coachesService.findByName(name);
  }

  @ResolveField(() => [Team])
  teams(@Parent() coach: User): Promise<Team[]> {
    return this.teamsService.findByCoachId(coach.id);
  }

  @Mutation(() => User)
  async createCoach(
    @Args('createCoachInput') createCoachInput: CreateCoachInput,
  ) {
    const coach = await this.coachesService.create(createCoachInput);
    this.pubSub.publish('coachCreated', { coachCreated: coach });
    return coach;
  }

  @Mutation(() => User)
  async updateCoach(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateCoachInput') updateCoachInput: UpdateCoachInput,
  ) {
    const coach = await this.coachesService.update(id, updateCoachInput);
    this.pubSub.publish('coachUpdated', { coachUpdated: coach });
    return coach;
  }

  @Mutation(() => Boolean)
  removeCoach(@Args('id', { type: () => ID }) id: string) {
    return this.coachesService.remove(id);
  }

  @Subscription(() => User, {
    name: 'coachUpdated',
  })
  coachUpdated() {
    return this.pubSub.asyncIterableIterator('coachUpdated');
  }

  @Subscription(() => User, {
    name: 'coachCreated',
  })
  coachCreated() {
    return this.pubSub.asyncIterableIterator('coachCreated');
  }
}
