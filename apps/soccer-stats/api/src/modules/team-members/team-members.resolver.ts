import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { TeamMemberRole } from '../../entities/team-member-role.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { AuthenticatedUser } from '../auth/authenticated-user.type';

import { TeamMembersService } from './team-members.service';

@Resolver(() => TeamMember)
@UseGuards(ClerkAuthGuard)
export class TeamMembersResolver {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  /**
   * Get all members of a team
   */
  @Query(() => [TeamMember], { name: 'teamMembers' })
  async getTeamMembers(
    @Args('teamId', { type: () => ID }) teamId: string,
  ): Promise<TeamMember[]> {
    return this.teamMembersService.findByTeam(teamId);
  }

  /**
   * Get current user's team memberships.
   * Uses internal user ID from the auth context.
   */
  @Query(() => [TeamMember], { name: 'myTeamMemberships' })
  async getMyTeamMemberships(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeamMember[]> {
    return this.teamMembersService.findByUser(user.id);
  }

  /**
   * Get a specific team membership
   */
  @Query(() => TeamMember, { name: 'teamMember', nullable: true })
  async getTeamMember(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TeamMember | null> {
    return this.teamMembersService.findOne(id);
  }

  /**
   * Get current user's membership in a specific team
   */
  @Query(() => TeamMember, { name: 'myMembershipInTeam', nullable: true })
  async getMyMembershipInTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeamMember | null> {
    return this.teamMembersService.findMembership(user.id, teamId);
  }

  /**
   * Check if current user is a member of a team
   */
  @Query(() => Boolean, { name: 'amITeamMember' })
  async amITeamMember(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<boolean> {
    return this.teamMembersService.isTeamMember(user.id, teamId);
  }

  /**
   * Get current user's highest role in a team
   */
  @Query(() => TeamRole, { name: 'myHighestRoleInTeam', nullable: true })
  async getMyHighestRoleInTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeamRole | null> {
    return this.teamMembersService.getHighestRole(user.id, teamId);
  }

  /**
   * Add a new member to a team with a specific role.
   * Creates both membership and role records.
   */
  @Mutation(() => TeamMember)
  async addTeamMember(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role', { type: () => TeamRole }) role: TeamRole,
    @CurrentUser() currentUser?: AuthenticatedUser,
  ): Promise<TeamMember> {
    return this.teamMembersService.addMember(
      teamId,
      userId,
      role,
      {},
      currentUser?.id,
    );
  }

  /**
   * Add an additional role to an existing member
   */
  @Mutation(() => TeamMember)
  async addRoleToMember(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @Args('role', { type: () => TeamRole }) role: TeamRole,
  ): Promise<TeamMember> {
    return this.teamMembersService.addRoleToMember(membershipId, role);
  }

  /**
   * Remove a role from a member.
   * Returns null if the membership was also removed (no roles left).
   */
  @Mutation(() => TeamMember, { nullable: true })
  async removeRoleFromMember(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @Args('role', { type: () => TeamRole }) role: TeamRole,
  ): Promise<TeamMember | null> {
    return this.teamMembersService.removeRoleFromMember(membershipId, role);
  }

  /**
   * Transfer team ownership to another member
   */
  @Mutation(() => TeamMember, { description: 'Returns the new owner' })
  async transferTeamOwnership(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('newOwnerId', { type: () => ID }) newOwnerId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TeamMember> {
    const result = await this.teamMembersService.transferOwnership(
      teamId,
      currentUser.id,
      newOwnerId,
    );
    return result.newOwner;
  }

  /**
   * Remove a member from a team entirely
   */
  @Mutation(() => Boolean)
  async removeTeamMember(
    @Args('membershipId', { type: () => ID }) membershipId: string,
  ): Promise<boolean> {
    return this.teamMembersService.removeMember(membershipId);
  }

  /**
   * Promote a guest coach to full coach
   */
  @Mutation(() => TeamMember)
  async promoteGuestCoach(
    @Args('membershipId', { type: () => ID }) membershipId: string,
  ): Promise<TeamMember> {
    return this.teamMembersService.promoteGuestCoach(membershipId);
  }

  // Field Resolvers

  @ResolveField(() => Team)
  async team(@Parent() teamMember: TeamMember): Promise<Team> {
    return teamMember.team;
  }

  @ResolveField(() => User)
  async user(@Parent() teamMember: TeamMember): Promise<User> {
    return teamMember.user;
  }

  @ResolveField(() => [TeamMemberRole])
  async roles(@Parent() teamMember: TeamMember): Promise<TeamMemberRole[]> {
    return teamMember.roles ?? [];
  }

  @ResolveField(() => User, { nullable: true })
  async invitedBy(@Parent() teamMember: TeamMember): Promise<User | null> {
    return teamMember.invitedBy ?? null;
  }
}
