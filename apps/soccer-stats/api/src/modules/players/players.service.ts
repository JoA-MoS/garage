import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';

import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
  ) {}

  async findAll(): Promise<User[]> {
    // Find users who are players (have TeamPlayer relationships)
    return this.userRepository.find({
      relations: ['playerTeams'],
      where: {
        playerTeams: {
          isActive: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['playerTeams', 'teamPlayers.team'],
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

    // Set player as inactive instead of deleting
    user.isActive = false;
    await this.userRepository.save(user);

    // Also deactivate all team relationships
    await this.teamPlayerRepository.update({ userId: id }, { isActive: false });

    return true;
  }

  async findByPosition(position: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['playerTeams'],
      where: {
        playerTeams: {
          primaryPosition: position,
          isActive: true,
        },
      },
    });
  }

  async findByName(name: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.playerTeams', 'teamPlayer')
      .where('teamPlayer.isActive = :isActive', { isActive: true })
      .andWhere(
        "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
        { name: `%${name}%` },
      )
      .getMany();
  }

  async findByTeamId(teamId: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['playerTeams'],
      where: {
        playerTeams: {
          team: { id: teamId },
          isActive: true,
        },
      },
    });
  }

  async getTeamPlayers(userId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { userId, isActive: true },
      relations: ['team'],
    });
  }

  async addPlayerToTeam(
    userId: string,
    teamId: string,
    jerseyNumber?: string,
    primaryPosition?: string,
    joinedDate?: Date,
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
    leftDate?: Date,
  ): Promise<boolean> {
    const result = await this.teamPlayerRepository.update(
      { userId, teamId, isActive: true },
      {
        isActive: false,
        leftDate: leftDate || new Date(),
      },
    );

    return (result.affected ?? 0) > 0;
  }
}
