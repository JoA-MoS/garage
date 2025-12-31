import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';

/**
 * Role hierarchy for team access control.
 * Higher values indicate more permissions.
 */
const ROLE_HIERARCHY: Record<TeamRole, number> = {
  [TeamRole.OWNER]: 5,
  [TeamRole.MANAGER]: 4,
  [TeamRole.COACH]: 3,
  [TeamRole.PLAYER]: 2,
  [TeamRole.PARENT_FAN]: 1,
};

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Find all members of a team, ordered by role hierarchy (OWNER first, then MANAGER, etc.)
   */
  async findByTeam(teamId: string): Promise<TeamMember[]> {
    // Use query builder to order by role hierarchy instead of alphabetical
    return this.teamMemberRepository
      .createQueryBuilder('teamMember')
      .leftJoinAndSelect('teamMember.user', 'user')
      .leftJoinAndSelect('teamMember.linkedPlayer', 'linkedPlayer')
      .leftJoinAndSelect('teamMember.invitedBy', 'invitedBy')
      .where('teamMember.teamId = :teamId', { teamId })
      .orderBy(
        `CASE teamMember.role
          WHEN 'OWNER' THEN 1
          WHEN 'MANAGER' THEN 2
          WHEN 'COACH' THEN 3
          WHEN 'PLAYER' THEN 4
          WHEN 'PARENT_FAN' THEN 5
          ELSE 6
        END`,
        'ASC'
      )
      .addOrderBy('teamMember.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Find all team memberships for a user
   */
  async findByUser(userId: string): Promise<TeamMember[]> {
    return this.teamMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['team', 'linkedPlayer'],
    });
  }

  /**
   * Find all teams a user belongs to, optionally filtered by roles.
   * Returns Team[] sorted by name.
   *
   * @param userId - The user ID
   * @param roles - Optional array of roles to filter by (e.g., [OWNER, MANAGER])
   */
  async findTeamsForUser(userId: string, roles?: TeamRole[]): Promise<Team[]> {
    let memberships = await this.findByUser(userId);

    if (roles && roles.length > 0) {
      memberships = memberships.filter((m) => roles.includes(m.role));
    }

    return memberships
      .filter((m) => m.team)
      .map((m) => m.team)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get team IDs for a user (optimized query for game lookups).
   */
  async findTeamIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.teamMemberRepository.find({
      where: { userId },
      select: ['teamId'],
    });
    return memberships.map((m) => m.teamId);
  }

  /**
   * Find a specific team membership
   */
  async findOne(id: string): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { id },
      relations: ['team', 'user', 'linkedPlayer', 'invitedBy'],
    });
  }

  /**
   * Find a user's role in a specific team
   */
  async findUserRoleInTeam(
    userId: string,
    teamId: string
  ): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { userId, teamId },
      relations: ['team', 'user'],
    });
  }

  /**
   * Get the owner of a team
   */
  async findTeamOwner(teamId: string): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({
      where: { teamId, role: TeamRole.OWNER },
      relations: ['user'],
    });
  }

  /**
   * Check if a user has a specific role (or higher) in a team.
   * Role hierarchy: OWNER > MANAGER > COACH > PLAYER > PARENT_FAN
   */
  async hasRoleOrHigher(
    userId: string,
    teamId: string,
    minimumRole: TeamRole
  ): Promise<boolean> {
    const membership = await this.findUserRoleInTeam(userId, teamId);
    if (!membership) return false;

    return ROLE_HIERARCHY[membership.role] >= ROLE_HIERARCHY[minimumRole];
  }

  /**
   * Check if user is a member of the team (any role)
   */
  async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    const count = await this.teamMemberRepository.count({
      where: { userId, teamId },
    });
    return count > 0;
  }

  /**
   * Add a member to a team
   */
  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole,
    invitedById?: string,
    linkedPlayerId?: string,
    isGuest = false
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

    // Check if user already has a membership in this team
    const existingMembership = await this.findUserRoleInTeam(userId, teamId);
    if (existingMembership) {
      throw new ForbiddenException(
        `User already has role ${existingMembership.role} in this team`
      );
    }

    // Ensure only one owner per team
    if (role === TeamRole.OWNER) {
      const existingOwner = await this.findTeamOwner(teamId);
      if (existingOwner) {
        throw new ForbiddenException(
          'Team already has an owner. Use transferOwnership to change owners.'
        );
      }
    }

    // Parent/fan must have a linked player
    if (role === TeamRole.PARENT_FAN && !linkedPlayerId) {
      throw new ForbiddenException(
        'Parent/Fan role requires a linked player ID'
      );
    }

    const teamMember = this.teamMemberRepository.create({
      teamId,
      userId,
      role,
      linkedPlayerId,
      isGuest,
      invitedById,
      invitedAt: invitedById ? new Date() : undefined,
      // TODO: See FEATURE_ROADMAP.md section 1.6 - Invitation system will add an acceptInvitation() method.
      // For now, only set acceptedAt for direct additions (not invitations).
      acceptedAt: !invitedById ? new Date() : undefined,
    });

    return this.teamMemberRepository.save(teamMember);
  }

  /**
   * Update a member's role
   */
  async updateRole(
    membershipId: string,
    newRole: TeamRole
  ): Promise<TeamMember> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`
      );
    }

    // Cannot change from/to owner role via this method
    if (membership.role === TeamRole.OWNER || newRole === TeamRole.OWNER) {
      throw new ForbiddenException(
        'Cannot change owner role. Use transferOwnership instead.'
      );
    }

    membership.role = newRole;
    return this.teamMemberRepository.save(membership);
  }

  /**
   * Transfer team ownership to another member
   */
  async transferOwnership(
    teamId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<{ previousOwner: TeamMember; newOwner: TeamMember }> {
    // Verify current owner
    const currentOwnerMembership = await this.findUserRoleInTeam(
      currentOwnerId,
      teamId
    );
    if (
      !currentOwnerMembership ||
      currentOwnerMembership.role !== TeamRole.OWNER
    ) {
      throw new ForbiddenException(
        'Only the current owner can transfer ownership'
      );
    }

    // Find new owner's membership
    const newOwnerMembership = await this.findUserRoleInTeam(
      newOwnerId,
      teamId
    );
    if (!newOwnerMembership) {
      throw new NotFoundException('New owner must be an existing team member');
    }

    // Transfer ownership
    currentOwnerMembership.role = TeamRole.MANAGER; // Demote to manager
    newOwnerMembership.role = TeamRole.OWNER;

    const [previousOwner, newOwner] = await Promise.all([
      this.teamMemberRepository.save(currentOwnerMembership),
      this.teamMemberRepository.save(newOwnerMembership),
    ]);

    return { previousOwner, newOwner };
  }

  /**
   * Remove a member from a team
   */
  async removeMember(membershipId: string): Promise<boolean> {
    const membership = await this.findOne(membershipId);
    if (!membership) {
      throw new NotFoundException(
        `Team membership with ID ${membershipId} not found`
      );
    }

    // Cannot remove owner
    if (membership.role === TeamRole.OWNER) {
      throw new ForbiddenException(
        'Cannot remove team owner. Transfer ownership first.'
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
        `Team membership with ID ${membershipId} not found`
      );
    }

    if (membership.role !== TeamRole.COACH || !membership.isGuest) {
      throw new ForbiddenException('Can only promote guest coaches');
    }

    membership.isGuest = false;
    return this.teamMemberRepository.save(membership);
  }
}
