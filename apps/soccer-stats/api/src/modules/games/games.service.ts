import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';

import { CreateGameInput } from './dto/create-game.input';
import { UpdateGameInput } from './dto/update-game.input';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    @InjectRepository(GameFormat)
    private readonly gameFormatRepository: Repository<GameFormat>
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find({
      relations: [
        'gameFormat',
        'gameTeams',
        'gameTeams.team',
        'gameTeams.team.teamPlayers',
        'gameTeams.team.teamPlayers.player',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.relatedPlayer',
        'participations',
        'participations.player',
        'participations.gameTeam',
      ],
    });
  }

  async findOne(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: [
        'gameFormat',
        'gameTeams',
        'gameTeams.team',
        'gameTeams.team.teamPlayers',
        'gameTeams.team.teamPlayers.player',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.relatedPlayer',
        'participations',
        'participations.player',
        'participations.gameTeam',
      ],
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async create(createGameInput: CreateGameInput): Promise<Game> {
    // Verify that both teams exist
    const homeTeam = await this.teamRepository.findOne({
      where: { id: createGameInput.homeTeamId },
    });
    const awayTeam = await this.teamRepository.findOne({
      where: { id: createGameInput.awayTeamId },
    });

    if (!homeTeam) {
      throw new NotFoundException(
        `Home team with ID ${createGameInput.homeTeamId} not found`
      );
    }
    if (!awayTeam) {
      throw new NotFoundException(
        `Away team with ID ${createGameInput.awayTeamId} not found`
      );
    }

    // Verify that the game format exists
    const gameFormat = await this.gameFormatRepository.findOne({
      where: { id: createGameInput.gameFormatId },
    });

    if (!gameFormat) {
      throw new NotFoundException(
        `Game format with ID ${createGameInput.gameFormatId} not found`
      );
    }

    // Create the game
    const game = this.gameRepository.create({
      gameFormatId: createGameInput.gameFormatId,
    });

    const savedGame = await this.gameRepository.save(game);

    // Create GameTeam relationships
    const homeGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.homeTeamId,
      teamType: 'home',
    });

    const awayGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.awayTeamId,
      teamType: 'away',
    });

    await this.gameTeamRepository.save([homeGameTeam, awayGameTeam]);

    return this.findOne(savedGame.id);
  }

  async update(id: string, updateGameInput: UpdateGameInput): Promise<Game> {
    await this.gameRepository.update(id, updateGameInput);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.gameRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
