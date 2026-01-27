import { Resolver, ResolveField, Parent, Context } from '@nestjs/graphql';

import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { TeamMemberRole } from '../../entities/team-member-role.entity';
import { GraphQLContext } from '../dataloaders';

/**
 * Resolver for Team entity field-level data loading.
 *
 * Uses DataLoaders to batch database queries and solve the N+1 problem.
 * Each field resolver only triggers when that field is actually queried.
 *
 * Note: Some fields like 'games', 'owner', 'teamConfiguration' are still
 * resolved in teams.resolver.ts as they have different access patterns
 * or require authorization checks.
 */
@Resolver(() => Team)
export class TeamFieldsResolver {
  /**
   * Resolves the 'teamMembers' field on Team.
   * Uses DataLoader to batch multiple membership lookups into a single query.
   *
   * Returns all active team members with their roles and user data.
   */
  @ResolveField(() => [TeamMember], {
    description: 'All team members with their roles',
  })
  async teamMembers(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamMember[]> {
    // If teamMembers was already loaded, return it
    if (team.teamMembers !== undefined) {
      return team.teamMembers;
    }
    // Use DataLoader to batch the query
    return context.loaders.teamMembersByTeamIdLoader.load(team.id);
  }

  /**
   * Resolves the 'roster' field on Team.
   * Returns members who have the PLAYER role.
   *
   * This is a convenience field for accessing the team's player roster.
   */
  @ResolveField(() => [TeamMemberRole], {
    description: "Team's player roster (PLAYER roles only)",
  })
  async roster(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamMemberRole[]> {
    const members = await context.loaders.teamMembersByTeamIdLoader.load(
      team.id,
    );

    // Extract PLAYER roles from all memberships
    // Attach the parent teamMember so the relation can be resolved
    const playerRoles: TeamMemberRole[] = [];
    for (const member of members) {
      const roles = member.roles || [];
      for (const role of roles) {
        if (role.role === TeamRole.PLAYER) {
          role.teamMember = member;
          playerRoles.push(role);
        }
      }
    }
    return playerRoles;
  }

  /**
   * Resolves the 'coaches' field on Team.
   * Returns members who have COACH or GUEST_COACH roles.
   *
   * This is a convenience field for accessing the team's coaching staff.
   */
  @ResolveField(() => [TeamMemberRole], {
    nullable: true,
    description: "Team's coaching staff (COACH and GUEST_COACH roles)",
  })
  async coaches(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<TeamMemberRole[]> {
    const members = await context.loaders.teamMembersByTeamIdLoader.load(
      team.id,
    );

    // Extract COACH and GUEST_COACH roles from all memberships
    // Attach the parent teamMember so the relation can be resolved
    const coachRoles: TeamMemberRole[] = [];
    for (const member of members) {
      const roles = member.roles || [];
      for (const role of roles) {
        if (
          role.role === TeamRole.COACH ||
          role.role === TeamRole.GUEST_COACH
        ) {
          role.teamMember = member;
          coachRoles.push(role);
        }
      }
    }
    return coachRoles;
  }

  /**
   * Resolves the 'players' field on Team (computed from roster).
   * Uses DataLoader to batch roster lookups into a single query,
   * then extracts the associated users.
   *
   * This is a convenience field that extracts users from the team's
   * PLAYER role memberships.
   */
  @ResolveField(() => [User], {
    description: 'Players on the team (users with PLAYER role)',
  })
  async players(
    @Parent() team: Team,
    @Context() context: GraphQLContext,
  ): Promise<User[]> {
    const members = await context.loaders.teamMembersByTeamIdLoader.load(
      team.id,
    );

    // Extract users who have PLAYER role
    const players: User[] = [];
    for (const member of members) {
      const hasPlayerRole = (member.roles || []).some(
        (role) => role.role === TeamRole.PLAYER,
      );
      if (hasPlayerRole && member.user) {
        players.push(member.user);
      }
    }
    return players;
  }
}
