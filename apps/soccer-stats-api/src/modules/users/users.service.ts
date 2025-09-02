import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, TeamRole, UserTeamRole, Team } from '../../entities';

export interface CreateUserInput {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTeamRole)
    private readonly userTeamRoleRepository: Repository<UserTeamRole>,
  ) {}

  async findOrCreateUser(input: CreateUserInput): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { clerkId: input.clerkId },
      relations: ['userTeamRoles', 'userTeamRoles.team'],
    });

    if (!user) {
      user = this.userRepository.create(input);
      await this.userRepository.save(user);
    } else {
      // Update user profile if needed
      const updated = await this.userRepository.save({
        ...user,
        email: input.email,
        firstName: input.firstName || user.firstName,
        lastName: input.lastName || user.lastName,
        profileImageUrl: input.profileImageUrl || user.profileImageUrl,
      });
      user = updated;
    }

    return user;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { clerkId },
      relations: ['userTeamRoles', 'userTeamRoles.team'],
    });
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeamRoles = await this.userTeamRoleRepository.find({
      where: { user: { id: userId } },
      relations: ['team'],
    });

    return userTeamRoles.map((utr) => utr.team);
  }

  async addUserToTeam(
    userId: string,
    teamId: string,
    role: TeamRole = TeamRole.PLAYER
  ): Promise<UserTeamRole> {
    const userTeamRole = this.userTeamRoleRepository.create({
      user: { id: userId },
      team: { id: teamId },
      role,
    });

    return this.userTeamRoleRepository.save(userTeamRole);
  }

  async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    await this.userTeamRoleRepository.delete({
      user: { id: userId },
      team: { id: teamId },
    });
  }

  async updateUserRole(
    userId: string,
    teamId: string,
    role: TeamRole
  ): Promise<UserTeamRole> {
    const userTeamRole = await this.userTeamRoleRepository.findOne({
      where: {
        user: { id: userId },
        team: { id: teamId },
      },
    });

    if (!userTeamRole) {
      throw new Error('User is not a member of this team');
    }

    userTeamRole.role = role;
    return this.userTeamRoleRepository.save(userTeamRole);
  }

  async getUserRole(userId: string, teamId: string): Promise<TeamRole | null> {
    const userTeamRole = await this.userTeamRoleRepository.findOne({
      where: {
        user: { id: userId },
        team: { id: teamId },
      },
    });

    return userTeamRole?.role || null;
  }

  hasPermission(userRole: TeamRole, requiredRole: TeamRole): boolean {
    const roleHierarchy = {
      [TeamRole.ADMIN]: 5,
      [TeamRole.COACH]: 4,
      [TeamRole.ASSISTANT_COACH]: 3,
      [TeamRole.TEAM_MANAGER]: 2,
      [TeamRole.PLAYER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}