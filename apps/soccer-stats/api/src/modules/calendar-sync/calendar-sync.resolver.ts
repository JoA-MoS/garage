import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { CalendarSource } from '../../entities/calendar-source.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { TeamAccessGuard } from '../auth/team-access.guard';
import { RequireTeamRole } from '../auth/require-team-role.decorator';
import { TeamRole } from '../../entities/team-member.entity';

import { CalendarSyncService } from './calendar-sync.service';
import { CreateCalendarSourceInput } from './dto/create-calendar-source.input';
import { CalendarSyncResultType } from './dto/calendar-sync-result.type';

@Resolver(() => CalendarSource)
export class CalendarSyncResolver {
  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Query(() => [CalendarSource], {
    name: 'teamCalendarSources',
    description: 'Calendar feeds connected to a team for schedule imports',
  })
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER, TeamRole.COACH], {
    teamIdArg: 'teamId',
  })
  teamCalendarSources(
    @Args('teamId', { type: () => ID }) teamId: string,
  ): Promise<CalendarSource[]> {
    return this.calendarSyncService.findSourcesForTeam(teamId);
  }

  @Mutation(() => CalendarSource, {
    name: 'createTeamCalendarSource',
    description:
      'Connect a team to an external calendar feed, such as PlayMetrics ICS',
  })
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER], {
    teamIdPath: 'input.teamId',
  })
  createTeamCalendarSource(
    @Args('input') input: CreateCalendarSourceInput,
  ): Promise<CalendarSource> {
    return this.calendarSyncService.createSource(input);
  }

  @Mutation(() => CalendarSyncResultType, {
    name: 'syncTeamCalendarSource',
    description:
      'Immediately import or update games from a connected team calendar feed',
  })
  @UseGuards(ClerkAuthGuard, TeamAccessGuard)
  @RequireTeamRole([TeamRole.OWNER, TeamRole.MANAGER, TeamRole.COACH], {
    teamIdArg: 'teamId',
  })
  syncTeamCalendarSource(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('sourceId', { type: () => ID }) sourceId: string,
  ): Promise<CalendarSyncResultType> {
    return this.calendarSyncService.syncSource(sourceId, teamId);
  }
}
