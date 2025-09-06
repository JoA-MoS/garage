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
    private readonly teamPlayerRepository: Repository<TeamPlayer>
  ) {}

  async findAll(): Promise<User[]> {
    // Find users who are players (have TeamPlayer relationships)
    return this.userRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          isActive: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['teamPlayers', 'teamPlayers.team'],
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
    updatePlayerInput: UpdatePlayerInput
  ): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updatePlayerInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }

  async findByPosition(position: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          primaryPosition: position,
          isActive: true,
        },
      },
    });
  }

  async findByName(name: string): Promise<User[]> {
    return this.userRepository.find({
      where: [{ firstName: name }, { lastName: name }],
    });
  }

  async findByTeamId(teamId: string): Promise<User[]> {
    return this.userRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          team: { id: teamId },
          isActive: true,
        },
      },
    });
  }

  // ResolveField methods
  async getTeamPlayers(userId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { user: { id: userId } },
      relations: ['team'],
    });
  }
}
