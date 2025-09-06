import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Player } from '../../entities/player.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameParticipation } from '../../entities/game-participation.entity';

import { CreatePlayerInput } from './dto/create-player.input';
import { UpdatePlayerInput } from './dto/update-player.input';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(GameParticipation)
    private readonly gameParticipationRepository: Repository<GameParticipation>
  ) {}

  async findAll(): Promise<Player[]> {
    return this.playerRepository.find();
  }

  async findOne(id: string): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID "${id}" not found`);
    }

    return player;
  }

  async create(createPlayerInput: CreatePlayerInput): Promise<Player> {
    const player = this.playerRepository.create(createPlayerInput);
    return this.playerRepository.save(player);
  }

  async update(
    id: string,
    updatePlayerInput: UpdatePlayerInput
  ): Promise<Player> {
    const player = await this.findOne(id);
    Object.assign(player, updatePlayerInput);
    return this.playerRepository.save(player);
  }

  async remove(id: string): Promise<boolean> {
    const player = await this.findOne(id);
    await this.playerRepository.remove(player);
    return true;
  }

  async findByPosition(position: string): Promise<Player[]> {
    return this.playerRepository.find({
      where: { position },
    });
  }

  async findByName(name: string): Promise<Player[]> {
    return this.playerRepository.find({
      where: { name },
    });
  }

  async findByTeamId(teamId: string): Promise<Player[]> {
    return this.playerRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          team: { id: teamId },
        },
      },
    });
  }

  // ResolveField methods
  async getTeamPlayers(playerId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { player: { id: playerId } },
      relations: ['team'],
    });
  }

  async getParticipations(playerId: string): Promise<GameParticipation[]> {
    return this.gameParticipationRepository.find({
      where: { player: { id: playerId } },
      relations: ['game'],
    });
  }
}
