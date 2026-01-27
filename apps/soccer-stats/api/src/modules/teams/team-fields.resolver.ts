import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for Team entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 *
 * Note: Some fields like 'games', 'owner', 'teamConfiguration', and
 * 'playersWithJersey' are still resolved in teams.resolver.ts as they have
 * different access patterns or require authorization checks.
 */
@Resolver(() => Team)
export class TeamFieldsResolver {
  /**
   * Resolves the 'roster' field on Team.
   * Uses DataLoader to batch multiple roster lookups into a single query.
   *
   * Returns the team's player roster (with user data included).
   */
  @ResolveField(() => [TeamPlayer], {
    description: "Team's player roster",
  })
  async roster(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamPlayer[]> {
    // If roster was already loaded (e.g., via eager loading), return it
    if (team.roster !== undefined) {
      return team.roster;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamPlayersByTeamIdLoader.load(team.id);
  }

  /**
   * Resolves the 'coaches' field on Team.
   * Uses DataLoader to batch multiple coaches lookups into a single query.
   *
   * Returns the team's coaching staff (with user data included).
   */
  @ResolveField(() => [TeamCoach], {
    nullable: true,
    description: "Team's coaching staff",
  })
  async coaches(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamCoach[]> {
    // If coaches was already loaded (e.g., via eager loading), return it
    if (team.coaches !== undefined) {
      return team.coaches;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamCoachesByTeamIdLoader.load(team.id);
  }

  /**
   * Resolves the 'players' field on Team (computed from roster).
   * Uses DataLoader to batch roster lookups into a single query,
   * then extracts the associated users.
   *
   * This is a convenience field that extracts users from the team's
   * roster relationships.
   */
  @ResolveField(() => [User], {
    description: 'Players on the team (users)',
  })
  async players(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<User[]> {
    // If roster is already loaded with users, extract them
    // (filter isActive since pre-loaded data may include inactive)
    if (team.roster !== undefined) {
      return team.roster
        .filter((tp) => tp.isActive && tp.user)
        .map((tp) => tp.user);
    }

    // DataLoader already filters isActive=true in the query
    const roster = await context.loaders.teamPlayersByTeamIdLoader.load(
      team.id,
    );
    return roster.filter((tp) => tp.user).map((tp) => tp.user);
  }
}
