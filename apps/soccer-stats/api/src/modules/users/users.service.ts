import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';

import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

export enum UserType {
  PLAYER = 'player',
  COACH = 'coach',
  ALL = 'all',
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(TeamCoach)
    private readonly teamCoachRepository: Repository<TeamCoach>
  ) {}

  async findAll(userType: UserType = UserType.ALL): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach')
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach');
        break;
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'teamPlayers',
        'teamPlayers.team',
        'teamCoaches',
        'teamCoaches.team',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByName(
    name: string,
    userType: UserType = UserType.ALL
  ): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${name}%` }
      );

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach')
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach');
        break;
    }

    return queryBuilder.getMany();
  }

  // Player-specific queries
  async findByPosition(position: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['teamPlayers'],
      where: {
        isActive: true,
        teamPlayers: {
          primaryPosition: position,
          isActive: true,
        },
      },
    });
  }

  // Coach-specific queries
  async findByCoachRole(role: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['teamCoaches'],
      where: {
        isActive: true,
        teamCoaches: {
          role,
          isActive: true,
        },
      },
    });
  }

  async findByTeam(
    teamId: string,
    userType: UserType = UserType.ALL
  ): Promise<User[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true });

    switch (userType) {
      case UserType.PLAYER:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .andWhere('teamPlayer.teamId = :teamId', { teamId })
          .andWhere('teamPlayer.isActive = :teamPlayerActive', {
            teamPlayerActive: true,
          });
        break;

      case UserType.COACH:
        queryBuilder
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach')
          .andWhere('teamCoach.teamId = :teamId', { teamId })
          .andWhere('teamCoach.isActive = :teamCoachActive', {
            teamCoachActive: true,
          });
        break;

      case UserType.ALL:
        queryBuilder
          .leftJoinAndSelect('user.teamPlayers', 'teamPlayer')
          .leftJoinAndSelect('user.teamCoaches', 'teamCoach')
          .andWhere(
            '(teamPlayer.teamId = :teamId AND teamPlayer.isActive = :teamPlayerActive) OR (teamCoach.teamId = :teamId AND teamCoach.isActive = :teamCoachActive)',
            { teamId, teamPlayerActive: true, teamCoachActive: true }
          );
        break;
    }

    return queryBuilder.getMany();
  }

  async create(createUserInput: CreateUserInput): Promise<User> {
    const user = this.userRepository.create(createUserInput);
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);

    // Set user as inactive instead of deleting
    user.isActive = false;
    await this.userRepository.save(user);

    // Also deactivate all relationships
    await this.teamPlayerRepository.update({ userId: id }, { isActive: false });
    await this.teamCoachRepository.update({ userId: id }, { isActive: false });

    return true;
  }

  // Relationship management methods
  async getTeamPlayers(userId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  async getTeamCoaches(userId: string): Promise<TeamCoach[]> {
    return this.teamCoachRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  // Player team management
  async addPlayerToTeam(
    userId: string,
    teamId: string,
    jerseyNumber?: string,
    primaryPosition?: string,
    joinedDate?: Date
  ): Promise<TeamPlayer> {
    const teamPlayer = this.teamPlayerRepository.create({
      userId,
      teamId,
      jerseyNumber,
      primaryPosition,
      joinedDate: joinedDate || new Date(),
      isActive: true,
    });

    return this.teamPlayerRepository.save(teamPlayer);
  }

  async removePlayerFromTeam(
    userId: string,
    teamId: string,
    leftDate?: Date
  ): Promise<boolean> {
    const result = await this.teamPlayerRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        leftDate: leftDate || new Date(),
      }
    );

    return (result.affected ?? 0) > 0;
  }

  // Coach team management
  async addCoachToTeam(
    userId: string,
    teamId: string,
    role: string,
    startDate: Date
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
    endDate?: Date
  ): Promise<boolean> {
    const result = await this.teamCoachRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        endDate: endDate || new Date(),
      }
    );

    return (result.affected ?? 0) > 0;
  }
}
