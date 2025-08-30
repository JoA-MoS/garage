import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Team } from '../../entities/team.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { GameTeam } from '../../entities/game-team.entity';

import { CreateTeamInput } from './dto/create-team.input';
import { UpdateTeamInput } from './dto/update-team.input';
import { AddPlayerToTeamInput } from './dto/add-player-to-team.input';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find();
  }

  async findOne(id: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }

    return team;
  }

  async create(createTeamInput: CreateTeamInput): Promise<Team> {
    const team = this.teamRepository.create(createTeamInput);
    return this.teamRepository.save(team);
  }

  async update(id: string, updateTeamInput: UpdateTeamInput): Promise<Team> {
    const team = await this.findOne(id);
    Object.assign(team, updateTeamInput);
    return this.teamRepository.save(team);
  }

  async remove(id: string): Promise<boolean> {
    const team = await this.findOne(id);
    await this.teamRepository.remove(team);
    return true;
  }

  async findByName(name: string): Promise<Team[]> {
    return this.teamRepository.find({
      where: { name },
    });
  }

  async findByPlayerId(playerId: string): Promise<Team[]> {
    return this.teamRepository.find({
      relations: ['teamPlayers'],
      where: {
        teamPlayers: {
          player: { id: playerId },
        },
      },
    });
  }

  // ResolveField methods

  async getTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
    return this.teamPlayerRepository.find({
      where: { team: { id: teamId } },
      relations: ['player'],
    });
  }

  async getGameTeams(teamId: string): Promise<GameTeam[]> {
    return this.gameTeamRepository.find({
      where: { team: { id: teamId } },
      relations: ['game'],
    });
  }

  async addPlayerToTeam(
    addPlayerToTeamInput: AddPlayerToTeamInput
  ): Promise<TeamPlayer> {
    // Verify team exists
    await this.findOne(addPlayerToTeamInput.teamId);

    // Check if player already exists in this team
    const existing = await this.teamPlayerRepository.findOne({
      where: {
        teamId: addPlayerToTeamInput.teamId,
        playerId: addPlayerToTeamInput.playerId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Player is already associated with this team`
      );
    }

    // Check if jersey number is already taken
    const jerseyTaken = await this.teamPlayerRepository.findOne({
      where: {
        teamId: addPlayerToTeamInput.teamId,
        jersey: addPlayerToTeamInput.jersey,
      },
    });

    if (jerseyTaken) {
      throw new ConflictException(
        `Jersey number ${addPlayerToTeamInput.jersey} is already taken`
      );
    }

    const teamPlayer = this.teamPlayerRepository.create({
      teamId: addPlayerToTeamInput.teamId,
      playerId: addPlayerToTeamInput.playerId,
      jersey: addPlayerToTeamInput.jersey,
      depthRank: addPlayerToTeamInput.depthRank || 1,
      isActive: addPlayerToTeamInput.isActive !== false,
    });

    return this.teamPlayerRepository.save(teamPlayer);
  }

  async removePlayerFromTeam(
    teamId: string,
    playerId: string
  ): Promise<boolean> {
    const teamPlayer = await this.teamPlayerRepository.findOne({
      where: { teamId, playerId },
    });

    if (!teamPlayer) {
      throw new NotFoundException(`Player is not associated with this team`);
    }

    await this.teamPlayerRepository.remove(teamPlayer);
    return true;
  }
}
