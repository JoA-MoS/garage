import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamCoach } from '../../entities/team-coach.entity';

import { CreateCoachInput } from './dto/create-coach.input';
import { UpdateCoachInput } from './dto/update-coach.input';

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamCoach)
    private readonly teamCoachRepository: Repository<TeamCoach>,
  ) {}

  async findAll(): Promise<User[]> {
    // Find users who are coaches (have TeamCoach relationships)
    return this.userRepository.find({
      relations: ['coachTeams'],
      where: {
        coachTeams: {
          isActive: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['coachTeams', 'coachTeams.team'],
    });

    if (!user) {
      throw new NotFoundException(`Coach with ID "${id}" not found`);
    }

    return user;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['coachTeams'],
      where: {
        coachTeams: {
          role,
          isActive: true,
        },
      },
    });
  }

  async findByName(name: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.coachTeams', 'teamCoach')
      .where('teamCoach.isActive = :isActive', { isActive: true })
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

    // Set coach as inactive instead of deleting
    user.isActive = false;
    await this.userRepository.save(user);

    // Also deactivate all coaching relationships
    await this.teamCoachRepository.update({ userId: id }, { isActive: false });

    return true;
  }

  async getTeamCoaches(userId: string): Promise<TeamCoach[]> {
    return this.teamCoachRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  async addCoachToTeam(
    userId: string,
    teamId: string,
    role: string,
    startDate: Date,
  ): Promise<TeamCoach> {
    const teamCoach = this.teamCoachRepository.create({
      userId,
      teamId,
      role,
      startDate,
      isActive: true,
    });

    return this.teamCoachRepository.save(teamCoach);
  }

  async removeCoachFromTeam(
    userId: string,
    teamId: string,
    endDate?: Date,
  ): Promise<boolean> {
    const result = await this.teamCoachRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        endDate: endDate || new Date(),
      },
    );

    return (result.affected ?? 0) > 0;
  }
}
