import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { Repository, In } from 'typeorm';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { User } from '../../entities/user.entity';
import { TeamPlayer } from '../../entities/team-player.entity';
import { TeamCoach } from '../../entities/team-coach.entity';
import { GameTimingService, GameTiming } from '../games/game-timing.service';
import { ObservabilityService } from '../observability/observability.service';

import { createInstrumentedDataLoader } from './instrumented-dataloader';

/**
 * Interface for all DataLoaders available in GraphQL context.
 * Each request gets a fresh set of loaders (request-scoped caching).
 */
export interface IDataLoaders {
  // Game-related loaders
  gameLoader: DataLoader<string, Game>;
  gameFormatLoader: DataLoader<string, GameFormat>;
  teamLoader: DataLoader<string, Team>;
  gameTeamsByGameLoader: DataLoader<string, GameTeam[]>;
  gameEventsByGameLoader: DataLoader<string, GameEvent[]>;
  gameEventsByGameTeamLoader: DataLoader<string, GameEvent[]>;
  gameTimingLoader: DataLoader<string, GameTiming>;

  // User/Player/Coach loaders
  userLoader: DataLoader<string, User>;
  teamPlayersByUserIdLoader: DataLoader<string, TeamPlayer[]>;
  teamCoachesByUserIdLoader: DataLoader<string, TeamCoach[]>;

  // Team roster loaders
  teamPlayersByTeamIdLoader: DataLoader<string, TeamPlayer[]>;
  teamCoachesByTeamIdLoader: DataLoader<string, TeamCoach[]>;
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamPlayer)
    private readonly teamPlayerRepository: Repository<TeamPlayer>,
    @InjectRepository(TeamCoach)
    private readonly teamCoachRepository: Repository<TeamCoach>,
    private readonly gameTimingService: GameTimingService,
    @Optional()
    private readonly observabilityService?: ObservabilityService,
  ) {}

  /**
   * Helper to create a DataLoader with optional instrumentation.
   * Uses the ObservabilityService when available to log batch metrics.
   */
  private createLoader<K, V>(
    name: string,
    batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>,
    options?: DataLoader.Options<K, V>,
  ): DataLoader<K, V> {
    return createInstrumentedDataLoader({
      name,
      batchFn,
      dataLoaderOptions: options,
      observabilityService: this.observabilityService,
    });
  }

  /**
   * Creates a fresh set of DataLoaders for a request.
   * Must be called per-request to ensure proper caching isolation.
   */
  createLoaders(): IDataLoaders {
    return {
      // Game-related loaders
      gameLoader: this.createGameLoader(),
      gameFormatLoader: this.createGameFormatLoader(),
      teamLoader: this.createTeamLoader(),
      gameTeamsByGameLoader: this.createGameTeamsByGameLoader(),
      gameEventsByGameLoader: this.createGameEventsByGameLoader(),
      gameEventsByGameTeamLoader: this.createGameEventsByGameTeamLoader(),
      gameTimingLoader: this.createGameTimingLoader(),

      // User/Player/Coach loaders
      userLoader: this.createUserLoader(),
      teamPlayersByUserIdLoader: this.createTeamPlayersByUserIdLoader(),
      teamCoachesByUserIdLoader: this.createTeamCoachesByUserIdLoader(),

      // Team roster loaders
      teamPlayersByTeamIdLoader: this.createTeamPlayersByTeamIdLoader(),
      teamCoachesByTeamIdLoader: this.createTeamCoachesByTeamIdLoader(),
    };
  }

  /**
   * Batch loads Games by their IDs.
   */
  private createGameLoader(): DataLoader<string, Game> {
    return this.createLoader<string, Game>('gameLoader', async (gameIds) => {
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
    return this.createLoader<string, GameFormat>(
      'gameFormatLoader',
      async (formatIds) => {
        const formats = await this.gameFormatRepository.find({
          where: { id: In([...formatIds]) },
        });

        const formatMap = new Map(formats.map((format) => [format.id, format]));
        return formatIds.map(
          (id) => formatMap.get(id) || new Error(`GameFormat not found: ${id}`),
        );
      },
    );
  }

  /**
   * Batch loads Teams by their IDs.
   */
  private createTeamLoader(): DataLoader<string, Team> {
    return this.createLoader<string, Team>('teamLoader', async (teamIds) => {
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
    return this.createLoader<string, GameTeam[]>(
      'gameTeamsByGameLoader',
      async (gameIds) => {
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
      },
    );
  }

  /**
   * Batch loads GameEvents by gameId.
   * Returns an array of GameEvents for each game, with related entities.
   *
   * Includes childEvents for consistency with gameEventsByGameTeamLoader.
   */
  private createGameEventsByGameLoader(): DataLoader<string, GameEvent[]> {
    return this.createLoader<string, GameEvent[]>(
      'gameEventsByGameLoader',
      async (gameIds) => {
        const gameEvents = await this.gameEventRepository.find({
          where: { gameId: In([...gameIds]) },
          relations: [
            'eventType',
            'player',
            'gameTeam',
            'childEvents',
            'childEvents.eventType',
            'childEvents.player',
          ],
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
      },
    );
  }

  /**
   * Batch loads GameEvents by gameTeamId.
   * Returns an array of GameEvents for each gameTeam, with related entities.
   *
   * This loader is used when events are accessed through GameTeam.gameEvents,
   * which is the primary access path in the frontend.
   *
   * Relations are consistent with gameEventsByGameLoader for predictable behavior.
   */
  private createGameEventsByGameTeamLoader(): DataLoader<string, GameEvent[]> {
    return this.createLoader<string, GameEvent[]>(
      'gameEventsByGameTeamLoader',
      async (gameTeamIds) => {
        const gameEvents = await this.gameEventRepository.find({
          where: { gameTeamId: In([...gameTeamIds]) },
          relations: [
            'eventType',
            'player',
            'gameTeam',
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
      },
    );
  }

  /**
   * Batch loads GameTiming by gameId.
   * Computes timing from timing events for multiple games in a single query.
   */
  private createGameTimingLoader(): DataLoader<string, GameTiming> {
    return this.createLoader<string, GameTiming>(
      'gameTimingLoader',
      async (gameIds) => {
        const timingMap = await this.gameTimingService.getGameTimingBatch([
          ...gameIds,
        ]);

        // Return timing for each game, defaulting to empty object if not found
        return gameIds.map((id) => timingMap.get(id) || {});
      },
    );
  }

  // ============================================================
  // User/Player/Coach DataLoaders
  // ============================================================

  /**
   * Batch loads Users by their IDs.
   */
  private createUserLoader(): DataLoader<string, User> {
    return this.createLoader<string, User>('userLoader', async (userIds) => {
      const users = await this.userRepository.find({
        where: { id: In([...userIds]) },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map(
        (id) => userMap.get(id) || new Error(`User not found: ${id}`),
      );
    });
  }

  /**
   * Batch loads TeamPlayers by userId.
   * Returns an array of TeamPlayers for each user (their team memberships as player).
   * Includes team relation for display purposes.
   */
  private createTeamPlayersByUserIdLoader(): DataLoader<string, TeamPlayer[]> {
    return this.createLoader<string, TeamPlayer[]>(
      'teamPlayersByUserIdLoader',
      async (userIds) => {
        const teamPlayers = await this.teamPlayerRepository.find({
          where: { userId: In([...userIds]), isActive: true },
          relations: ['team'],
        });

        // Group by userId
        const teamPlayersMap = new Map<string, TeamPlayer[]>();
        for (const tp of teamPlayers) {
          const existing = teamPlayersMap.get(tp.userId) || [];
          existing.push(tp);
          teamPlayersMap.set(tp.userId, existing);
        }

        return userIds.map((id) => teamPlayersMap.get(id) || []);
      },
    );
  }

  /**
   * Batch loads TeamCoaches by userId.
   * Returns an array of TeamCoaches for each user (their team memberships as coach).
   * Includes team relation for display purposes.
   */
  private createTeamCoachesByUserIdLoader(): DataLoader<string, TeamCoach[]> {
    return this.createLoader<string, TeamCoach[]>(
      'teamCoachesByUserIdLoader',
      async (userIds) => {
        const teamCoaches = await this.teamCoachRepository.find({
          where: { userId: In([...userIds]), isActive: true },
          relations: ['team'],
        });

        // Group by userId
        const teamCoachesMap = new Map<string, TeamCoach[]>();
        for (const tc of teamCoaches) {
          const existing = teamCoachesMap.get(tc.userId) || [];
          existing.push(tc);
          teamCoachesMap.set(tc.userId, existing);
        }

        return userIds.map((id) => teamCoachesMap.get(id) || []);
      },
    );
  }

  // ============================================================
  // Team Roster DataLoaders
  // ============================================================

  /**
   * Batch loads TeamPlayers by teamId.
   * Returns an array of TeamPlayers for each team (the team's roster).
   * Includes user relation for display purposes.
   */
  private createTeamPlayersByTeamIdLoader(): DataLoader<string, TeamPlayer[]> {
    return this.createLoader<string, TeamPlayer[]>(
      'teamPlayersByTeamIdLoader',
      async (teamIds) => {
        const teamPlayers = await this.teamPlayerRepository.find({
          where: { teamId: In([...teamIds]), isActive: true },
          relations: ['user'],
        });

        // Group by teamId
        const teamPlayersMap = new Map<string, TeamPlayer[]>();
        for (const tp of teamPlayers) {
          const existing = teamPlayersMap.get(tp.teamId) || [];
          existing.push(tp);
          teamPlayersMap.set(tp.teamId, existing);
        }

        return teamIds.map((id) => teamPlayersMap.get(id) || []);
      },
    );
  }

  /**
   * Batch loads TeamCoaches by teamId.
   * Returns an array of TeamCoaches for each team (the team's coaching staff).
   * Includes user relation for display purposes.
   */
  private createTeamCoachesByTeamIdLoader(): DataLoader<string, TeamCoach[]> {
    return this.createLoader<string, TeamCoach[]>(
      'teamCoachesByTeamIdLoader',
      async (teamIds) => {
        const teamCoaches = await this.teamCoachRepository.find({
          where: { teamId: In([...teamIds]), isActive: true },
          relations: ['user'],
        });

        // Group by teamId
        const teamCoachesMap = new Map<string, TeamCoach[]>();
        for (const tc of teamCoaches) {
          const existing = teamCoachesMap.get(tc.teamId) || [];
          existing.push(tc);
          teamCoachesMap.set(tc.teamId, existing);
        }

        return teamIds.map((id) => teamCoachesMap.get(id) || []);
      },
    );
  }
}
