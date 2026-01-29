import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import {
  TeamMemberRole,
  PlayerRoleData,
  CoachRoleData,
  GuardianRoleData,
  FanRoleData,
  RoleData,
} from '../../entities/team-member-role.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';

/**
 * Role hierarchy for team access control.
 * Higher values indicate more permissions.
 */
/**
 * Role ordering for display purposes.
 * Note: Actual permissions are handled by role guards at the resolver level.
 */
const ROLE_ORDER: Record<TeamRole, number> = {
  [TeamRole.OWNER]: 7,
  [TeamRole.MANAGER]: 6,
  [TeamRole.COACH]: 5,
  [TeamRole.GUEST_COACH]: 4,
  [TeamRole.PLAYER]: 3,
  [TeamRole.GUARDIAN]: 2,
  [TeamRole.FAN]: 1,
};

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamMemberRole)
    private teamMemberRoleRepository: Repository<TeamMemberRole>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ============================================================
  // Query Methods
  // ============================================================

  /**
   * Find all members of a team with their roles.
   * Ordered by highest role first.
   */
  async findByTeam(teamId: string): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      where: { teamId, isActive: true },
      relations: ['user', 'roles', 'invitedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Find all team memberships for a user.
   * Loads team relation by default; roles are loaded via field resolver when needed.
   */
  async findByUser(
    userId: string,
    options?: { includeRoles?: boolean },
  ): Promise<TeamMember[]> {
    const relations: string[] = ['team'];
    if (options?.includeRoles) {
      relations.push('roles');
    }
    return this.teamMemberRepository.find({
      where: { userId, isActive: true },
      relations,
    });
  }

  /**
   * Find all teams a user belongs to.
   * @param roles If provided, filter to teams where user has at least one of these roles
   */
  async findTeamsForUser(userId: string, roles?: TeamRole[]): Promise<Team[]> {
    // Only load roles if we need to filter by them
    const needsRoles = roles && roles.length > 0;
    const memberships = await this.findByUser(userId, {
      includeRoles: needsRoles,
    });

    let filtered = memberships.filter((m) => m.team);

    if (needsRoles) {
      filtered = filtered.filter((m) =>
        m.roles?.some((r) => roles.includes(r.role)),
      );
    }

    return filtered
      .map((m) => m.team)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get team IDs for a user (optimized query for game lookups).
   */
  async findTeamIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId, isActive: true },
      select: ['teamId'],
    });
    return memberships.map((m) => m.teamId);
  }

  /**
   * Find a specific team membership by ID
   */
  async findOne(id: string): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { id },
      relations: ['team', 'user', 'roles', 'invitedBy'],
    });
  }

  /**
   * Find a user's membership in a specific team
   */
  async findMembership(
    userId: string,
    teamId: string,
  ): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { userId, teamId },
      relations: ['team', 'user', 'roles'],
    });
  }

  /**
   * Check if a user has a specific role in a team
   */
  async hasRole(
    userId: string,
    teamId: string,
    role: TeamRole,
  ): Promise<boolean> {
    const membership = await this.findMembership(userId, teamId);
    if (!membership || !membership.roles) return false;
    return membership.roles.some((r) => r.role === role);
  }

  /**
   * Get the owner membership of a team
   */
  async findTeamOwner(teamId: string): Promise<TeamMember | null> {
    const members = await this.teamMemberRepository.find({
      where: { teamId, isActive: true },
      relations: ['user', 'roles'],
    });

    for (const member of members) {
      if (member.roles?.some((r) => r.role === TeamRole.OWNER)) {
        return member;
      }
    }
    return null;
  }

  /**
   * Check if a user has a specific role (or higher) in a team.
   */
  async hasRoleOrHigher(
    userId: string,
    teamId: string,
    minimumRole: TeamRole,
  ): Promise<boolean> {
    const membership = await this.findMembership(userId, teamId);
    if (!membership || !membership.roles) return false;

    const minLevel = ROLE_ORDER[minimumRole];
    return membership.roles.some((r) => ROLE_ORDER[r.role] >= minLevel);
  }

  /**
   * Check if user is a member of the team (any role)
   */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const count = await this.teamMemberRepository.count({
      where: { userId, teamId, isActive: true },
    });
    return count > 0;
  }

  /**
   * Get the highest role a user has in a team
   */
  async getHighestRole(
    userId: string,
    teamId: string,
  ): Promise<TeamRole | null> {
    const membership = await this.findMembership(userId, teamId);
    if (!membership || !membership.roles || membership.roles.length === 0) {
      return null;
    }

    let highestRole = membership.roles[0].role;
    let highestLevel = ROLE_ORDER[highestRole];

    for (const roleRecord of membership.roles) {
      const level = ROLE_ORDER[roleRecord.role];
      if (level > highestLevel) {
        highestRole = roleRecord.role;
        highestLevel = level;
      }
    }

    return highestRole;
  }

  // ============================================================
  // Membership Management
  // ============================================================

  /**
   * Add a member to a team with a specific role.
   * Creates both TeamMember and TeamMemberRole records.
   */
  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole,
    roleData:
      | PlayerRoleData
      | CoachRoleData
      | GuardianRoleData
      | FanRoleData = {},
    invitedById?: string,
  ): Promise<TeamMember> {
    // Verify team exists
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user already has this role in this team
    const existingMembership = await this.findMembership(userId, teamId);
    if (existingMembership) {
      const hasRole = existingMembership.roles?.some((r) => r.role === role);
      if (hasRole) {
        throw new ForbiddenException(
          `User already has ${role} role in this team`,
        );
      }
      // User exists but doesn't have this role - add the role
      return this.addRoleToMember(existingMembership.id, role, roleData);
    }

    // Ensure only one owner per team
    if (role === TeamRole.OWNER) {
      const existingOwner = await this.findTeamOwner(teamId);
      if (existingOwner) {
        throw new ForbiddenException(
          'Team already has an owner. Use transferOwnership to change owners.',
        );
      }
    }

    // Guardian must have a linked player (required)
    if (role === TeamRole.GUARDIAN) {
      const guardianData = roleData as GuardianRoleData;
      if (!guardianData.linkedPlayerId) {
        throw new ForbiddenException(
          'Guardian role requires a linked player ID',
        );
      }
    }
    // Fan linkedPlayerId is optional - they can just follow the team

    // Create membership
    const teamMember = this.teamMemberRepository.create({
      teamId,
      userId,
      joinedDate: new Date(),
      isActive: true,
      invitedById,
      invitedAt: invitedById ? new Date() : undefined,
      acceptedAt: !invitedById ? new Date() : undefined,
    });

    const savedMember = await this.teamMemberRepository.save(teamMember);

    // Create role
    const teamMemberRole = this.teamMemberRoleRepository.create({
      teamMemberId: savedMember.id,
      role,
      roleData,
    });
    await this.teamMemberRoleRepository.save(teamMemberRole);

    // Return with relations
    const result = await this.findOne(savedMember.id);
    if (!result) {
      throw new InternalServerErrorException(
        `Failed to retrieve newly created membership ${savedMember.id}. This may indicate a database consistency issue.`,
      );
    }
    return result;
  }

  /**
   * Add a role to an existing membership
   */
  async addRoleToMember(
    membershipId: string,
    role: TeamRole,
    roleData:
      | PlayerRoleData
      | CoachRoleData
      | GuardianRoleData
      | FanRoleData = {},
  ): Promise<TeamMember> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`,
      );
    }

    // Check if role already exists
    const existingRole = membership.roles?.find((r) => r.role === role);
    if (existingRole) {
      throw new ForbiddenException(`Member already has ${role} role`);
    }

    // Ensure only one owner per team
    if (role === TeamRole.OWNER) {
      const existingOwner = await this.findTeamOwner(membership.teamId);
      if (existingOwner && existingOwner.id !== membershipId) {
        throw new ForbiddenException(
          'Team already has an owner. Use transferOwnership to change owners.',
        );
      }
    }

    // Create role
    const teamMemberRole = this.teamMemberRoleRepository.create({
      teamMemberId: membershipId,
      role,
      roleData,
    });
    await this.teamMemberRoleRepository.save(teamMemberRole);

    const result = await this.findOne(membershipId);
    if (!result) {
      throw new InternalServerErrorException(
        `Failed to retrieve membership ${membershipId} after adding role. This may indicate a database consistency issue.`,
      );
    }
    return result;
  }

  /**
   * Remove a role from a membership
   */
  async removeRoleFromMember(
    membershipId: string,
    role: TeamRole,
  ): Promise<TeamMember | null> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`,
      );
    }

    // Cannot remove owner role
    if (role === TeamRole.OWNER) {
      throw new ForbiddenException(
        'Cannot remove owner role. Transfer ownership first.',
      );
    }

    const roleRecord = membership.roles?.find((r) => r.role === role);
    if (!roleRecord) {
      throw new NotFoundException(`Member does not have ${role} role`);
    }

    await this.teamMemberRoleRepository.remove(roleRecord);

    // If no roles left, remove the membership
    const updatedMembership = await this.findOne(membershipId);

    // Handle case where membership was already removed (race condition)
    if (!updatedMembership) {
      return null;
    }

    // If no roles remain, remove the membership entirely
    if (!updatedMembership.roles?.length) {
      await this.teamMemberRepository.remove(updatedMembership);
      return null;
    }

    return updatedMembership;
  }

  /**
   * Update role-specific data
   */
  async updateRoleData(
    membershipId: string,
    role: TeamRole,
    roleData: Partial<
      PlayerRoleData | CoachRoleData | GuardianRoleData | FanRoleData
    >,
  ): Promise<TeamMemberRole> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`,
      );
    }

    const roleRecord = membership.roles?.find((r) => r.role === role);
    if (!roleRecord) {
      throw new NotFoundException(`Member does not have ${role} role`);
    }

    roleRecord.roleData = { ...roleRecord.roleData, ...roleData } as RoleData;
    return this.teamMemberRoleRepository.save(roleRecord);
  }

  /**
   * Transfer team ownership to another member
   */
  async transferOwnership(
    teamId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<{ previousOwner: TeamMember; newOwner: TeamMember }> {
    // Verify current owner
    const currentOwnerMembership = await this.findMembership(
      currentOwnerId,
      teamId,
    );
    if (!currentOwnerMembership) {
      throw new NotFoundException('Current owner membership not found');
    }

    const hasOwnerRole = currentOwnerMembership.roles?.some(
      (r) => r.role === TeamRole.OWNER,
    );
    if (!hasOwnerRole) {
      throw new ForbiddenException(
        'Only the current owner can transfer ownership',
      );
    }

    // Find new owner's membership
    let newOwnerMembership = await this.findMembership(newOwnerId, teamId);
    if (!newOwnerMembership) {
      throw new NotFoundException('New owner must be an existing team member');
    }

    // Remove OWNER from current owner, add MANAGER if they don't have it
    await this.removeRoleFromMember(currentOwnerMembership.id, TeamRole.OWNER);
    const hasManagerRole = currentOwnerMembership.roles?.some(
      (r) => r.role === TeamRole.MANAGER,
    );
    if (!hasManagerRole) {
      await this.addRoleToMember(currentOwnerMembership.id, TeamRole.MANAGER);
    }

    // Add OWNER to new owner
    newOwnerMembership = await this.addRoleToMember(
      newOwnerMembership.id,
      TeamRole.OWNER,
    );

    const previousOwner = await this.findOne(currentOwnerMembership.id);
    if (!previousOwner) {
      throw new InternalServerErrorException(
        `Failed to retrieve previous owner membership after ownership transfer. This may indicate a database consistency issue.`,
      );
    }

    return { previousOwner, newOwner: newOwnerMembership };
  }

  /**
   * Remove a member from a team entirely
   */
  async removeMember(membershipId: string): Promise<boolean> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`,
      );
    }

    // Cannot remove owner
    const hasOwnerRole = membership.roles?.some(
      (r) => r.role === TeamRole.OWNER,
    );
    if (hasOwnerRole) {
      throw new ForbiddenException(
        'Cannot remove team owner. Transfer ownership first.',
      );
    }

    await this.teamMemberRepository.remove(membership);
    return true;
  }

  /**
   * Promote a guest coach to full coach
   */
  async promoteGuestCoach(membershipId: string): Promise<TeamMember> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`,
      );
    }

    const guestCoachRole = membership.roles?.find(
      (r) => r.role === TeamRole.GUEST_COACH,
    );
    if (!guestCoachRole) {
      throw new ForbiddenException('Can only promote guest coaches');
    }

    // Change role from GUEST_COACH to COACH
    guestCoachRole.role = TeamRole.COACH;
    await this.teamMemberRoleRepository.save(guestCoachRole);

    const result = await this.findOne(membershipId);
    if (!result) {
      throw new InternalServerErrorException(
        `Failed to retrieve membership ${membershipId} after promoting guest coach. This may indicate a database consistency issue.`,
      );
    }
    return result;
  }

  // ============================================================
  // Convenience Methods for Player/Coach Operations
  // ============================================================

  /**
   * Add a player to a team
   */
  async addPlayer(
    teamId: string,
    userId: string,
    playerData: PlayerRoleData = {},
    invitedById?: string,
  ): Promise<TeamMember> {
    return this.addMember(
      teamId,
      userId,
      TeamRole.PLAYER,
      playerData,
      invitedById,
    );
  }

  /**
   * Add a coach to a team
   */
  async addCoach(
    teamId: string,
    userId: string,
    coachData: CoachRoleData = {},
    isGuest = false,
    invitedById?: string,
  ): Promise<TeamMember> {
    const role = isGuest ? TeamRole.GUEST_COACH : TeamRole.COACH;
    return this.addMember(teamId, userId, role, coachData, invitedById);
  }

  /**
   * Find members with PLAYER role for a team
   */
  async findPlayersForTeam(teamId: string): Promise<TeamMember[]> {
    const members = await this.findByTeam(teamId);
    return members.filter((m) =>
      m.roles?.some((r) => r.role === TeamRole.PLAYER),
    );
  }

  /**
   * Find members with COACH or GUEST_COACH role for a team
   */
  async findCoachesForTeam(teamId: string): Promise<TeamMember[]> {
    const members = await this.findByTeam(teamId);
    return members.filter((m) =>
      m.roles?.some(
        (r) => r.role === TeamRole.COACH || r.role === TeamRole.GUEST_COACH,
      ),
    );
  }
}
