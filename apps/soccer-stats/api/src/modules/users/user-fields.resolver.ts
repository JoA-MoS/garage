import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { User } from '../../entities/user.entity';
import { Team } from '../../entities/team.entity';
import { TeamMember } from '../../entities/team-member.entity';
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
   * Resolves the 'teamMemberships' field on User.
   * Uses DataLoader to batch multiple membership lookups into a single query.
   *
   * Returns the user's team memberships with their roles.
   */
  @ResolveField(() => [TeamMember], {
    description: "User's team memberships (with roles)",
  })
  async teamMemberships(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<TeamMember[]> {
    // If teamMemberships was already loaded, return it
    if (user.teamMemberships !== undefined) {
      return user.teamMemberships;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamMembersByUserIdLoader.load(user.id);
  }

  /**
   * Resolves the 'teams' field on User.
   * Returns all teams the user is a member of (any role).
   */
  @ResolveField(() => [Team], {
    description: 'All teams the user is a member of',
  })
  async teams(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Team[]> {
    // If teamMemberships is already loaded with teams, extract them
    if (user.teamMemberships !== undefined) {
      return user.teamMemberships
        .filter((tm) => tm.isActive && tm.team)
        .map((tm) => tm.team);
    }

    const memberships = await context.loaders.teamMembersByUserIdLoader.load(
      user.id,
    );
    return memberships.filter((tm) => tm.team).map((tm) => tm.team);
  }
}
