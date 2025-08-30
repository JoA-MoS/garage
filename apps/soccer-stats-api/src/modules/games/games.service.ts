import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';

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
    private readonly gameTeamRepository: Repository<GameTeam>
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find({
      relations: [
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

    // Create the game
    const game = this.gameRepository.create({
      format: createGameInput.format,
      duration: createGameInput.duration || 90,
      status: GameStatus.NOT_STARTED,
      currentTime: 0,
    });

    const savedGame = await this.gameRepository.save(game);

    // Create GameTeam relationships
    const homeGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.homeTeamId,
      isHome: true,
    });

    const awayGameTeam = this.gameTeamRepository.create({
      gameId: savedGame.id,
      teamId: createGameInput.awayTeamId,
      isHome: false,
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

  async startGame(id: string): Promise<Game> {
    await this.gameRepository.update(id, {
      status: GameStatus.IN_PROGRESS,
      startTime: new Date(),
    });
    return this.findOne(id);
  }

  async pauseGame(id: string): Promise<Game> {
    await this.gameRepository.update(id, {
      status: GameStatus.PAUSED,
    });
    return this.findOne(id);
  }

  async endGame(id: string): Promise<Game> {
    await this.gameRepository.update(id, {
      status: GameStatus.FINISHED,
      endTime: new Date(),
    });
    return this.findOne(id);
  }

  async updateGameTime(id: string, currentTime: number): Promise<Game> {
    await this.gameRepository.update(id, { currentTime });
    return this.findOne(id);
  }
}
