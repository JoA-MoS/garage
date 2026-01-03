import { Resolver, ResolveField, Parent } from '@nestjs/graphql';

import { TeamPlayer } from '../../entities/team-player.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamsService } from '../teams/teams.service';

import { UsersService } from './users.service';

/**
 * Resolver for TeamPlayer entity to ensure relations are properly resolved.
 *
 * Without this resolver, mutations that return TeamPlayer (like addPlayerToTeam)
 * may fail with "Cannot return null for non-nullable field TeamPlayer.team"
 * because GraphQL can't resolve the team/user fields without explicit resolvers.
 */
@Resolver(() => TeamPlayer)
export class TeamPlayerResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly teamsService: TeamsService,
  ) {}

  @ResolveField(() => Team)
  async team(@Parent() teamPlayer: TeamPlayer): Promise<Team> {
    // If team is already loaded, return it
    if (teamPlayer.team) {
      return teamPlayer.team;
    }
    // Otherwise, load it from the database
    const team = await this.teamsService.findOne(teamPlayer.teamId);
    if (!team) {
      throw new Error(`Team not found for id: ${teamPlayer.teamId}`);
    }
    return team;
  }

  @ResolveField(() => User)
  async user(@Parent() teamPlayer: TeamPlayer): Promise<User> {
    // If user is already loaded, return it
    if (teamPlayer.user) {
      return teamPlayer.user;
    }
    // Otherwise, load it from the database
    const user = await this.usersService.findOne(teamPlayer.userId);
    if (!user) {
      throw new Error(`User not found for id: ${teamPlayer.userId}`);
    }
    return user;
  }
}
