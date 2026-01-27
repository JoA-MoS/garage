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
   * Resolves the 'playerTeams' field on User.
   * Uses DataLoader to batch multiple playerTeams lookups into a single query.
   *
   * Returns the user's team memberships as a player (with team data included).
   */
  @ResolveField(() => [TeamPlayer], {
    description: "User's team memberships as a player",
  })
  async playerTeams(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<TeamPlayer[]> {
    // If playerTeams was already loaded (e.g., via eager loading), return it
    if (user.playerTeams !== undefined) {
      return user.playerTeams;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamPlayersByUserIdLoader.load(user.id);
  }

  /**
   * Resolves the 'coachTeams' field on User.
   * Uses DataLoader to batch multiple coachTeams lookups into a single query.
   *
   * Returns the user's team memberships as a coach (with team data included).
   */
  @ResolveField(() => [TeamCoach], {
    description: "User's team memberships as a coach",
  })
  async coachTeams(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<TeamCoach[]> {
    // If coachTeams was already loaded (e.g., via eager loading), return it
    if (user.coachTeams !== undefined) {
      return user.coachTeams;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamCoachesByUserIdLoader.load(user.id);
  }

  /**
   * Resolves the 'teams' field on User (computed from playerTeams).
   * Uses DataLoader to batch playerTeams lookups into a single query,
   * then extracts the associated teams.
   *
   * This is a convenience field that extracts teams from the user's
   * playerTeams relationships.
   */
  @ResolveField(() => [Team], {
    description: 'Teams the user is a player on',
  })
  async teams(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Team[]> {
    // If playerTeams is already loaded with teams, extract them
    // (filter isActive since pre-loaded data may include inactive)
    if (user.playerTeams !== undefined) {
      return user.playerTeams
        .filter((tp) => tp.isActive && tp.team)
        .map((tp) => tp.team);
    }

    // DataLoader already filters isActive=true in the query
    const playerTeams = await context.loaders.teamPlayersByUserIdLoader.load(
      user.id,
    );
    return playerTeams.filter((tp) => tp.team).map((tp) => tp.team);
  }
}
