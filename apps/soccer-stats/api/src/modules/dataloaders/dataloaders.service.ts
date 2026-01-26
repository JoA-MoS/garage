import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import DataLoader from 'dataloader';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { GameTimingService, GameTiming } from '../games/game-timing.service';

/**
 * Interface for all DataLoaders available in GraphQL context.
 * Each request gets a fresh set of loaders (request-scoped caching).
 */
export interface IDataLoaders {
  gameLoader: DataLoader<string, Game>;
  gameFormatLoader: DataLoader<string, GameFormat>;
  teamLoader: DataLoader<string, Team>;
  gameTeamsByGameLoader: DataLoader<string, GameTeam[]>;
  gameEventsByGameLoader: DataLoader<string, GameEvent[]>;
  gameEventsByGameTeamLoader: DataLoader<string, GameEvent[]>;
  gameTimingLoader: DataLoader<string, GameTiming>;
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
    @InjectRepository(GameEvent)
    private readonly gameEventRepository: Repository<GameEvent>,
    private readonly gameTimingService: GameTimingService,
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
      gameEventsByGameLoader: this.createGameEventsByGameLoader(),
      gameEventsByGameTeamLoader: this.createGameEventsByGameTeamLoader(),
      gameTimingLoader: this.createGameTimingLoader(),
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

  /**
   * Batch loads GameEvents by gameId.
   * Returns an array of GameEvents for each game, with related entities.
   *
   * NOTE: This loads events with their eventType and player relations.
   * For deeply nested data (childEvents), use separate field resolvers.
   */
  private createGameEventsByGameLoader(): DataLoader<string, GameEvent[]> {
    return new DataLoader<string, GameEvent[]>(async (gameIds) => {
      const gameEvents = await this.gameEventRepository.find({
        where: { gameId: In([...gameIds]) },
        relations: ['eventType', 'player', 'gameTeam'],
        order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
      });

      // Group by gameId
      const eventsMap = new Map<string, GameEvent[]>();
      for (const event of gameEvents) {
        const existing = eventsMap.get(event.gameId) || [];
        existing.push(event);
        eventsMap.set(event.gameId, existing);
      }

      return gameIds.map((id) => eventsMap.get(id) || []);
    });
  }

  /**
   * Batch loads GameEvents by gameTeamId.
   * Returns an array of GameEvents for each gameTeam, with related entities.
   *
   * This loader is used when events are accessed through GameTeam.gameEvents,
   * which is the primary access path in the frontend.
   */
  private createGameEventsByGameTeamLoader(): DataLoader<string, GameEvent[]> {
    return new DataLoader<string, GameEvent[]>(async (gameTeamIds) => {
      const gameEvents = await this.gameEventRepository.find({
        where: { gameTeamId: In([...gameTeamIds]) },
        relations: [
          'eventType',
          'player',
          'childEvents',
          'childEvents.eventType',
          'childEvents.player',
        ],
        order: { gameMinute: 'ASC', gameSecond: 'ASC', createdAt: 'ASC' },
      });

      // Group by gameTeamId
      const eventsMap = new Map<string, GameEvent[]>();
      for (const event of gameEvents) {
        if (event.gameTeamId) {
          const existing = eventsMap.get(event.gameTeamId) || [];
          existing.push(event);
          eventsMap.set(event.gameTeamId, existing);
        }
      }

      return gameTeamIds.map((id) => eventsMap.get(id) || []);
    });
  }

  /**
   * Batch loads GameTiming by gameId.
   * Computes timing from timing events for multiple games in a single query.
   */
  private createGameTimingLoader(): DataLoader<string, GameTiming> {
    return new DataLoader<string, GameTiming>(async (gameIds) => {
      const timingMap = await this.gameTimingService.getGameTimingBatch([
        ...gameIds,
      ]);

      // Return timing for each game, defaulting to empty object if not found
      return gameIds.map((id) => timingMap.get(id) || {});
    });
  }
}
