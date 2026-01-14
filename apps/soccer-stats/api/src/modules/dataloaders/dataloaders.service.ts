import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import DataLoader from 'dataloader';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';

/**
 * Interface for all DataLoaders available in GraphQL context.
 * Each request gets a fresh set of loaders (request-scoped caching).
 */
export interface IDataLoaders {
  gameLoader: DataLoader<string, Game>;
  gameFormatLoader: DataLoader<string, GameFormat>;
  teamLoader: DataLoader<string, Team>;
  gameTeamsByGameLoader: DataLoader<string, GameTeam[]>;
}

/**
 * Service that creates DataLoader instances for batching database queries.
 *
 * DataLoaders solve the N+1 query problem by:
 * 1. Collecting all IDs requested within a single tick of the event loop
 * 2. Making a single batched query for all IDs
 * 3. Caching results for the duration of the request
 */
@Injectable()
export class DataLoadersService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameFormat)
    private readonly gameFormatRepository: Repository<GameFormat>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
  ) {}

  /**
   * Creates a fresh set of DataLoaders for a request.
   * Must be called per-request to ensure proper caching isolation.
   */
  createLoaders(): IDataLoaders {
    return {
      gameLoader: this.createGameLoader(),
      gameFormatLoader: this.createGameFormatLoader(),
      teamLoader: this.createTeamLoader(),
      gameTeamsByGameLoader: this.createGameTeamsByGameLoader(),
    };
  }

  /**
   * Batch loads Games by their IDs.
   */
  private createGameLoader(): DataLoader<string, Game> {
    return new DataLoader<string, Game>(async (gameIds) => {
      const games = await this.gameRepository.find({
        where: { id: In([...gameIds]) },
      });

      // Map results back to the order of requested IDs
      const gameMap = new Map(games.map((game) => [game.id, game]));
      return gameIds.map(
        (id) => gameMap.get(id) || new Error(`Game not found: ${id}`),
      );
    });
  }

  /**
   * Batch loads GameFormats by their IDs.
   */
  private createGameFormatLoader(): DataLoader<string, GameFormat> {
    return new DataLoader<string, GameFormat>(async (formatIds) => {
      const formats = await this.gameFormatRepository.find({
        where: { id: In([...formatIds]) },
      });

      const formatMap = new Map(formats.map((format) => [format.id, format]));
      return formatIds.map(
        (id) => formatMap.get(id) || new Error(`GameFormat not found: ${id}`),
      );
    });
  }

  /**
   * Batch loads Teams by their IDs.
   */
  private createTeamLoader(): DataLoader<string, Team> {
    return new DataLoader<string, Team>(async (teamIds) => {
      const teams = await this.teamRepository.find({
        where: { id: In([...teamIds]) },
      });

      const teamMap = new Map(teams.map((team) => [team.id, team]));
      return teamIds.map(
        (id) => teamMap.get(id) || new Error(`Team not found: ${id}`),
      );
    });
  }

  /**
   * Batch loads GameTeams by gameId.
   * Returns an array of GameTeams for each game.
   */
  private createGameTeamsByGameLoader(): DataLoader<string, GameTeam[]> {
    return new DataLoader<string, GameTeam[]>(async (gameIds) => {
      const gameTeams = await this.gameTeamRepository.find({
        where: { gameId: In([...gameIds]) },
        relations: ['team'], // Include team for display
      });

      // Group by gameId
      const gameTeamsMap = new Map<string, GameTeam[]>();
      for (const gt of gameTeams) {
        const existing = gameTeamsMap.get(gt.gameId) || [];
        existing.push(gt);
        gameTeamsMap.set(gt.gameId, existing);
      }

      return gameIds.map((id) => gameTeamsMap.get(id) || []);
    });
  }
}
