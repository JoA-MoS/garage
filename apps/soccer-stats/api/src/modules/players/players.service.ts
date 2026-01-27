import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';
import { TeamMembersService } from '../team-members/team-members.service';

import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

/**
 * Service for player-specific operations.
 * For team membership operations, use TeamMembersService.
 */
@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @Inject(forwardRef(() => TeamMembersService))
    private readonly teamMembersService: TeamMembersService,
  ) {}

  /**
   * Find all users who have an active PLAYER role in any team.
   */
  async findAll(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.teamMemberships', 'membership')
      .innerJoin('membership.roles', 'role')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('membership.isActive = :membershipActive', {
        membershipActive: true,
      })
      .andWhere('role.role = :playerRole', { playerRole: TeamRole.PLAYER })
      .getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'teamMemberships',
        'teamMemberships.roles',
        'teamMemberships.team',
      ],
    });

    if (!user) {
      throw new NotFoundException(`Player with ID "${id}" not found`);
    }

    return user;
  }

  async create(createPlayerInput: CreatePlayerInput): Promise<User> {
    const user = this.userRepository.create(createPlayerInput);
    return this.userRepository.save(user);
  }

  async update(
    id: string,
    updatePlayerInput: UpdatePlayerInput,
  ): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updatePlayerInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    // Use transaction to ensure both user and memberships are deactivated atomically
    await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Set player as inactive instead of deleting
        user.isActive = false;
        await transactionalEntityManager.save(user);

        // Also deactivate all team memberships
        await transactionalEntityManager.update(
          TeamMember,
          { userId: id },
          { isActive: false },
        );
      },
    );

    return true;
  }

  /**
   * Find players by primary position.
   * Searches the roleData JSONB for primaryPosition.
   */
  async findByPosition(position: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.teamMemberships', 'membership')
      .innerJoin('membership.roles', 'role')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('membership.isActive = :membershipActive', {
        membershipActive: true,
      })
      .andWhere('role.role = :playerRole', { playerRole: TeamRole.PLAYER })
      .andWhere("role.roleData->>'primaryPosition' = :position", { position })
      .getMany();
  }

  async findByName(name: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.teamMemberships', 'membership')
      .innerJoin('membership.roles', 'role')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('role.role = :playerRole', { playerRole: TeamRole.PLAYER })
      .andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${name}%` },
      )
      .getMany();
  }

  /**
   * Find players for a specific team.
   */
  async findByTeamId(teamId: string): Promise<User[]> {
    const members = await this.teamMembersService.findPlayersForTeam(teamId);
    return members
      .filter((m) => m.user !== null && m.user !== undefined)
      .map((m) => m.user as User);
  }
}
