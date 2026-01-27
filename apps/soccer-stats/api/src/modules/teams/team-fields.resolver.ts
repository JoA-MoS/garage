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
 * Note: Some fields like 'gameTeams', 'owner', 'teamConfiguration', and
 * 'playersWithJersey' are still resolved in teams.resolver.ts as they have
 * different access patterns or require authorization checks.
 */
@Resolver(() => Team)
export class TeamFieldsResolver {
  /**
   * Resolves the 'teamPlayers' field on Team.
   * Uses DataLoader to batch multiple teamPlayers lookups into a single query.
   *
   * Returns the team's roster (with user data included).
   */
  @ResolveField(() => [TeamPlayer], {
    description: "Team's player roster",
  })
  async teamPlayers(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamPlayer[]> {
    // If teamPlayers was already loaded (e.g., via eager loading), return it
    if (team.teamPlayers !== undefined) {
      return team.teamPlayers;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamPlayersByTeamIdLoader.load(team.id);
  }

  /**
   * Resolves the 'teamCoaches' field on Team.
   * Uses DataLoader to batch multiple teamCoaches lookups into a single query.
   *
   * Returns the team's coaching staff (with user data included).
   */
  @ResolveField(() => [TeamCoach], {
    nullable: true,
    description: "Team's coaching staff",
  })
  async teamCoaches(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamCoach[]> {
    // If teamCoaches was already loaded (e.g., via eager loading), return it
    if (team.teamCoaches !== undefined) {
      return team.teamCoaches;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamCoachesByTeamIdLoader.load(team.id);
  }

  /**
   * Resolves the 'players' field on Team (computed from teamPlayers).
   * Uses DataLoader to batch teamPlayers lookups into a single query,
   * then extracts the associated users.
   *
   * This is a convenience field that extracts users from the team's
   * teamPlayers relationships.
   */
  @ResolveField(() => [User], {
    description: 'Players on the team (users)',
  })
  async players(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<User[]> {
    // If teamPlayers is already loaded with users, extract them
    // (filter isActive since pre-loaded data may include inactive)
    if (team.teamPlayers !== undefined) {
      return team.teamPlayers
        .filter((tp) => tp.isActive && tp.user)
        .map((tp) => tp.user);
    }

    // DataLoader already filters isActive=true in the query
    const teamPlayers = await context.loaders.teamPlayersByTeamIdLoader.load(
      team.id,
    );
    return teamPlayers.filter((tp) => tp.user).map((tp) => tp.user);
  }
}
