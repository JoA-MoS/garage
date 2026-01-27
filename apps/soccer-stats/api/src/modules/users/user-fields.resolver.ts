import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for User entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 *
 * This resolver handles relationship fields for users regardless of whether
 * they're accessed as players, coaches, or general users.
 */
@Resolver(() => User)
export class UserFieldsResolver {
  /**
   * Resolves the 'teamPlayers' field on User.
   * Uses DataLoader to batch multiple teamPlayers lookups into a single query.
   *
   * Returns the user's team memberships as a player (with team data included).
   */
  @ResolveField(() => [TeamPlayer], {
    description: "User's team memberships as a player",
  })
  async teamPlayers(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<TeamPlayer[]> {
    // If teamPlayers was already loaded (e.g., via eager loading), return it
    if (user.teamPlayers !== undefined) {
      return user.teamPlayers;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamPlayersByUserIdLoader.load(user.id);
  }

  /**
   * Resolves the 'teamCoaches' field on User.
   * Uses DataLoader to batch multiple teamCoaches lookups into a single query.
   *
   * Returns the user's team memberships as a coach (with team data included).
   */
  @ResolveField(() => [TeamCoach], {
    description: "User's team memberships as a coach",
  })
  async teamCoaches(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<TeamCoach[]> {
    // If teamCoaches was already loaded (e.g., via eager loading), return it
    if (user.teamCoaches !== undefined) {
      return user.teamCoaches;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamCoachesByUserIdLoader.load(user.id);
  }

  /**
   * Resolves the 'teams' field on User (computed from teamPlayers).
   * Uses DataLoader to batch teamPlayers lookups into a single query,
   * then extracts the associated teams.
   *
   * This is a convenience field that extracts teams from the user's
   * teamPlayers relationships.
   */
  @ResolveField(() => [Team], {
    description: 'Teams the user is a player on',
  })
  async teams(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Team[]> {
    // If teamPlayers is already loaded with teams, extract them
    // (filter isActive since pre-loaded data may include inactive)
    if (user.teamPlayers !== undefined) {
      return user.teamPlayers
        .filter((tp) => tp.isActive && tp.team)
        .map((tp) => tp.team);
    }

    // DataLoader already filters isActive=true in the query
    const teamPlayers = await context.loaders.teamPlayersByUserIdLoader.load(
      user.id,
    );
    return teamPlayers.filter((tp) => tp.team).map((tp) => tp.team);
  }
}
