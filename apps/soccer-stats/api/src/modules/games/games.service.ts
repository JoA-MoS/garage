import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Game, GameStatus } from '../../entities/game.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { GameEvent } from '../../entities/game-event.entity';

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
    private readonly gameFormatRepository: Repository<GameFormat>,
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find({
      relations: [
        'gameFormat',
        'gameTeams',
        'gameTeams.team',
        'gameTeams.team.teamPlayers',
        'gameTeams.team.teamPlayers.user',
        'gameTeams.gameEvents',
        'gameTeams.gameEvents.eventType',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.recordedByUser',
        'gameEvents.gameTeam',
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
        'gameTeams.team.teamPlayers.user',
        'gameTeams.gameEvents',
        'gameTeams.gameEvents.eventType',
        'gameEvents',
        'gameEvents.eventType',
        'gameEvents.player',
        'gameEvents.recordedByUser',
        'gameEvents.gameTeam',
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
    // Handle resetGame flag - reset to SCHEDULED and clear all timestamps
    if (updateGameInput.resetGame) {
      // Optionally clear all game events
      if (updateGameInput.clearEvents) {
        await this.gameEventRepository
          .createQueryBuilder()
          .delete()
          .where('gameId = :gameId', { gameId: id })
          .execute();
      }

      await this.gameRepository
        .createQueryBuilder()
        .update(Game)
        .set({
          status: GameStatus.SCHEDULED,
          actualStart: () => 'NULL',
          firstHalfEnd: () => 'NULL',
          secondHalfStart: () => 'NULL',
          actualEnd: () => 'NULL',
          pausedAt: () => 'NULL',
        })
        .where('id = :id', { id })
        .execute();
      return this.findOne(id);
    }

    // Extract only the fields that don't exist on the Game entity (from CreateGameInput)
    const {
      homeTeamId: _homeTeamId,
      awayTeamId: _awayTeamId,
      gameFormatId: _gameFormatId,
      duration: _duration,
      resetGame: _resetGame,
      clearEvents: _clearEvents,
      ...gameFields
    } = updateGameInput as Record<string, unknown>;

    // Only update with valid Game entity fields
    if (Object.keys(gameFields).length > 0) {
      await this.gameRepository.update(id, gameFields);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.gameRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
