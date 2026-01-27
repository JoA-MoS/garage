import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamMember, TeamRole } from '../../entities/team-member.entity';

import { CreateCoachInput } from './dto/create-coach.input';
import { UpdateCoachInput } from './dto/update-coach.input';

/**
 * Service for coach-specific operations.
 * For team membership operations, use TeamMembersService.
 */
@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
  ) {}

  /**
   * Find all users who have an active COACH or GUEST_COACH role in any team.
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
      .andWhere('role.role IN (:...coachRoles)', {
        coachRoles: [TeamRole.COACH, TeamRole.GUEST_COACH],
      })
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
      throw new NotFoundException(`Coach with ID "${id}" not found`);
    }

    return user;
  }

  /**
   * Find users with a specific coach title.
   * Searches the roleData JSONB for title.
   */
  async findByRole(title: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.teamMemberships', 'membership')
      .innerJoin('membership.roles', 'role')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('membership.isActive = :membershipActive', {
        membershipActive: true,
      })
      .andWhere('role.role IN (:...coachRoles)', {
        coachRoles: [TeamRole.COACH, TeamRole.GUEST_COACH],
      })
      .andWhere("role.roleData->>'title' = :title", { title })
      .getMany();
  }

  async findByName(name: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.teamMemberships', 'membership')
      .innerJoin('membership.roles', 'role')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('role.role IN (:...coachRoles)', {
        coachRoles: [TeamRole.COACH, TeamRole.GUEST_COACH],
      })
      .andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${name}%` },
      )
      .getMany();
  }

  async create(createCoachInput: CreateCoachInput): Promise<User> {
    const user = this.userRepository.create(createCoachInput);
    return this.userRepository.save(user);
  }

  async update(id: string, updateCoachInput: UpdateCoachInput): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateCoachInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    // Use transaction to ensure both user and memberships are deactivated atomically
    await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // Set coach as inactive instead of deleting
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
}
