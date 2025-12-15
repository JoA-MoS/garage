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
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ClerkUser } from '../auth/clerk.service';

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
    @Args('teamId', { type: () => ID }) teamId: string
  ): Promise<TeamMember[]> {
    return this.teamMembersService.findByTeam(teamId);
  }

  /**
   * Get current user's team memberships.
   * Note: Clerk user IDs (e.g., "user_xxx") are stored directly in the database as the primary
   * user identifier. This is intentional - see User entity and ClerkAuthGuard for the sync logic.
   */
  @Query(() => [TeamMember], { name: 'myTeamMemberships' })
  async getMyTeamMemberships(
    @CurrentUser() user: ClerkUser
  ): Promise<TeamMember[]> {
    return this.teamMembersService.findByUser(user.id);
  }

  /**
   * Get a specific team membership
   */
  @Query(() => TeamMember, { name: 'teamMember', nullable: true })
  async getTeamMember(
    @Args('id', { type: () => ID }) id: string
  ): Promise<TeamMember | null> {
    return this.teamMembersService.findOne(id);
  }

  /**
   * Get current user's role in a specific team
   */
  @Query(() => TeamMember, { name: 'myRoleInTeam', nullable: true })
  async getMyRoleInTeam(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentUser() user: ClerkUser
  ): Promise<TeamMember | null> {
    return this.teamMembersService.findUserRoleInTeam(user.id, teamId);
  }

  /**
   * Check if current user is a member of a team
   */
  @Query(() => Boolean, { name: 'amITeamMember' })
  async amITeamMember(
    @Args('teamId', { type: () => ID }) teamId: string,
    @CurrentUser() user: ClerkUser
  ): Promise<boolean> {
    return this.teamMembersService.isTeamMember(user.id, teamId);
  }

  /**
   * Add a new member to a team
   * TODO: Add role-based authorization (only OWNER, MANAGER can add most roles)
   */
  @Mutation(() => TeamMember)
  async addTeamMember(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('role', { type: () => TeamRole }) role: TeamRole,
    @Args('linkedPlayerId', { type: () => ID, nullable: true })
    linkedPlayerId?: string,
    @Args('isGuest', { nullable: true }) isGuest?: boolean,
    @CurrentUser() currentUser?: ClerkUser
  ): Promise<TeamMember> {
    return this.teamMembersService.addMember(
      teamId,
      userId,
      role,
      currentUser?.id,
      linkedPlayerId,
      isGuest ?? false
    );
  }

  /**
   * Update a member's role
   * TODO: Add role-based authorization
   */
  @Mutation(() => TeamMember)
  async updateTeamMemberRole(
    @Args('membershipId', { type: () => ID }) membershipId: string,
    @Args('newRole', { type: () => TeamRole }) newRole: TeamRole
  ): Promise<TeamMember> {
    return this.teamMembersService.updateRole(membershipId, newRole);
  }

  /**
   * Transfer team ownership to another member
   */
  @Mutation(() => TeamMember, { description: 'Returns the new owner' })
  async transferTeamOwnership(
    @Args('teamId', { type: () => ID }) teamId: string,
    @Args('newOwnerId', { type: () => ID }) newOwnerId: string,
    @CurrentUser() currentUser: ClerkUser
  ): Promise<TeamMember> {
    const result = await this.teamMembersService.transferOwnership(
      teamId,
      currentUser.id,
      newOwnerId
    );
    return result.newOwner;
  }

  /**
   * Remove a member from a team
   * TODO: Add role-based authorization
   */
  @Mutation(() => Boolean)
  async removeTeamMember(
    @Args('membershipId', { type: () => ID }) membershipId: string
  ): Promise<boolean> {
    return this.teamMembersService.removeMember(membershipId);
  }

  /**
   * Promote a guest coach to full coach
   * TODO: Add role-based authorization (OWNER, MANAGER only)
   */
  @Mutation(() => TeamMember)
  async promoteGuestCoach(
    @Args('membershipId', { type: () => ID }) membershipId: string
  ): Promise<TeamMember> {
    return this.teamMembersService.promoteGuestCoach(membershipId);
  }

  // Field Resolvers

  @ResolveField(() => Team)
  async team(@Parent() teamMember: TeamMember): Promise<Team> {
    // Team is loaded via relation
    return teamMember.team;
  }

  @ResolveField(() => User)
  async user(@Parent() teamMember: TeamMember): Promise<User> {
    // User is loaded via relation
    return teamMember.user;
  }

  @ResolveField(() => User, { nullable: true })
  async linkedPlayer(@Parent() teamMember: TeamMember): Promise<User | null> {
    return teamMember.linkedPlayer ?? null;
  }

  @ResolveField(() => User, { nullable: true })
  async invitedBy(@Parent() teamMember: TeamMember): Promise<User | null> {
    return teamMember.invitedBy ?? null;
  }
}
