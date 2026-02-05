import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { Repository, In } from 'typeorm';

import { Game } from '../../entities/game.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEvent } from '../../entities/game-event.entity';
import { EventType } from '../../entities/event-type.entity';
import { User } from '../../entities/user.entity';
import { TeamMember } from '../../entities/team-member.entity';
import { TeamMemberRole } from '../../entities/team-member-role.entity';
import { GameTimingService, GameTiming } from '../games/game-timing.service';
import { ObservabilityService } from '../observability/observability.service';
import { LineupService } from '../game-events/services/lineup.service';
import { StatsService } from '../game-events/services/stats.service';
import { GameLineup } from '../game-events/dto/game-lineup.output';
import { PlayerFullStats } from '../game-events/dto/player-full-stats.output';

import { createInstrumentedDataLoader } from './instrumented-dataloader';

/**
 * Period timing info returned by getPeriodTimingInfo.
 * Used for time sync fields on Game type.
 */
export interface PeriodTimingInfo {
  period1DurationSeconds: number;
  period2DurationSeconds: number;
  currentPeriod?: string;
  currentPeriodSeconds: number;
  serverTimestamp: number;
}

/**
 * Interface for all DataLoaders available in GraphQL context.
 * Each request gets a fresh set of loaders (request-scoped caching).
 */
export interface IDataLoaders {
  // Game-related loaders
  gameLoader: DataLoader<string, Game>;
  gameFormatLoader: DataLoader<string, GameFormat>;
  teamLoader: DataLoader<string, Team>;
  gameTeamLoader: DataLoader<string, GameTeam>;
  gameTeamsByGameLoader: DataLoader<string, GameTeam[]>;
  gameEventLoader: DataLoader<string, GameEvent>;
  gameEventsByGameLoader: DataLoader<string, GameEvent[]>;
  gameEventsByGameTeamLoader: DataLoader<string, GameEvent[]>;
  childEventsByParentIdLoader: DataLoader<string, GameEvent[]>;
  gameTimingLoader: DataLoader<string, GameTiming>;

  // Game lineup and stats loaders
  /** Loads game lineup (roster, starters, bench, on-field) by gameTeamId */
  lineupByGameTeamLoader: DataLoader<string, GameLineup>;
  /** Loads player stats for a game team by gameTeamId */
  playerStatsByGameTeamLoader: DataLoader<string, PlayerFullStats[]>;
  /** Loads period timing info by composite key "gameId:durationMinutes" */
  periodTimingInfoLoader: DataLoader<string, PeriodTimingInfo>;

  // Reference data loaders
  eventTypeLoader: DataLoader<string, EventType>;

  // User loader
  userLoader: DataLoader<string, User>;

  // Team membership loaders (new unified model)
  teamMembersByTeamIdLoader: DataLoader<string, TeamMember[]>;
  teamMembersByUserIdLoader: DataLoader<string, TeamMember[]>;
  teamMemberRolesByMemberIdLoader: DataLoader<string, TeamMemberRole[]>;
  teamMemberLoader: DataLoader<string, TeamMember>;
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
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamMemberRole)
    private readonly teamMemberRoleRepository: Repository<TeamMemberRole>,
    private readonly gameTimingService: GameTimingService,
    private readonly lineupService: LineupService,
    private readonly statsService: StatsService,
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
      gameTeamLoader: this.createGameTeamLoader(),
      gameTeamsByGameLoader: this.createGameTeamsByGameLoader(),
      gameEventLoader: this.createGameEventLoader(),
      gameEventsByGameLoader: this.createGameEventsByGameLoader(),
      gameEventsByGameTeamLoader: this.createGameEventsByGameTeamLoader(),
      childEventsByParentIdLoader: this.createChildEventsByParentIdLoader(),
      gameTimingLoader: this.createGameTimingLoader(),

      // Game lineup and stats loaders
      lineupByGameTeamLoader: this.createLineupByGameTeamLoader(),
      playerStatsByGameTeamLoader: this.createPlayerStatsByGameTeamLoader(),
      periodTimingInfoLoader: this.createPeriodTimingInfoLoader(),

      // Reference data loaders
      eventTypeLoader: this.createEventTypeLoader(),

      // User loader
      userLoader: this.createUserLoader(),

      // Team membership loaders (new unified model)
      teamMembersByTeamIdLoader: this.createTeamMembersByTeamIdLoader(),
      teamMembersByUserIdLoader: this.createTeamMembersByUserIdLoader(),
      teamMemberRolesByMemberIdLoader:
        this.createTeamMemberRolesByMemberIdLoader(),
      teamMemberLoader: this.createTeamMemberLoader(),
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
   * Batch loads GameTeams by their IDs (single entity lookup).
   */
  private createGameTeamLoader(): DataLoader<string, GameTeam> {
    return this.createLoader<string, GameTeam>(
      'gameTeamLoader',
      async (gameTeamIds) => {
        const gameTeams = await this.gameTeamRepository.find({
          where: { id: In([...gameTeamIds]) },
        });

        const gameTeamMap = new Map(gameTeams.map((gt) => [gt.id, gt]));
        return gameTeamIds.map(
          (id) => gameTeamMap.get(id) || new Error(`GameTeam not found: ${id}`),
        );
      },
    );
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
   * Note: childEvents are loaded on-demand via childEventsByParentIdLoader
   * to reduce memory pressure during game tracking.
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
            // Removed: childEvents and nested relations
            // Use childEventsByParentIdLoader for on-demand loading
          ],
          order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
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
   * Note: childEvents are loaded on-demand via childEventsByParentIdLoader
   * to reduce memory pressure during game tracking.
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
            // Removed: childEvents and nested relations
            // Use childEventsByParentIdLoader for on-demand loading
          ],
          order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
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
   * Batch loads single GameEvents by their IDs.
   * Used for GameEvent.parentEvent field resolution.
   */
  private createGameEventLoader(): DataLoader<string, GameEvent> {
    return this.createLoader<string, GameEvent>(
      'gameEventLoader',
      async (eventIds) => {
        const events = await this.gameEventRepository.find({
          where: { id: In([...eventIds]) },
        });

        const eventMap = new Map(events.map((e) => [e.id, e]));
        return eventIds.map(
          (id) => eventMap.get(id) || new Error(`GameEvent not found: ${id}`),
        );
      },
    );
  }

  /**
   * Batch loads child GameEvents by parentEventId.
   * Used for GameEvent.childEvents field resolution.
   *
   * Includes eventType and player relations since child events
   * are now loaded on-demand instead of eagerly with parent events.
   */
  private createChildEventsByParentIdLoader(): DataLoader<string, GameEvent[]> {
    return this.createLoader<string, GameEvent[]>(
      'childEventsByParentIdLoader',
      async (parentIds) => {
        const events = await this.gameEventRepository.find({
          where: { parentEventId: In([...parentIds]) },
          relations: ['eventType', 'player'], // Add relations for child events
          order: { period: 'ASC', periodSecond: 'ASC', createdAt: 'ASC' },
        });

        // Group by parentEventId
        const eventsMap = new Map<string, GameEvent[]>();
        for (const event of events) {
          if (event.parentEventId) {
            const existing = eventsMap.get(event.parentEventId) || [];
            existing.push(event);
            eventsMap.set(event.parentEventId, existing);
          }
        }

        return parentIds.map((id) => eventsMap.get(id) || []);
      },
    );
  }

  /**
   * Batch loads EventTypes by their IDs.
   * Used for GameEvent.eventType field resolution.
   */
  private createEventTypeLoader(): DataLoader<string, EventType> {
    return this.createLoader<string, EventType>(
      'eventTypeLoader',
      async (eventTypeIds) => {
        const eventTypes = await this.eventTypeRepository.find({
          where: { id: In([...eventTypeIds]) },
        });

        const eventTypeMap = new Map(eventTypes.map((et) => [et.id, et]));
        return eventTypeIds.map(
          (id) =>
            eventTypeMap.get(id) || new Error(`EventType not found: ${id}`),
        );
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
  // Game Lineup and Stats DataLoaders
  // ============================================================

  /**
   * Batch loads game lineups by gameTeamId.
   * Each lineup includes game roster, starters, bench, and current on-field players.
   *
   * Note: This loader provides request-scoped memoization. Multiple calls with
   * the same gameTeamId will return the cached result from the first call.
   */
  private createLineupByGameTeamLoader(): DataLoader<string, GameLineup> {
    return this.createLoader<string, GameLineup>(
      'lineupByGameTeamLoader',
      async (gameTeamIds) => {
        // Load lineups in parallel
        const results = await Promise.allSettled(
          gameTeamIds.map((id) => this.lineupService.getGameLineup(id)),
        );

        return results.map((result, idx) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          return new Error(
            `Failed to load lineup for gameTeam ${gameTeamIds[idx]}: ${result.reason}`,
          );
        });
      },
    );
  }

  /**
   * Batch loads player stats by gameTeamId.
   * Returns full player statistics including playing time, goals, and assists.
   *
   * Note: This loader provides request-scoped memoization. Multiple calls with
   * the same gameTeamId will return the cached result from the first call.
   */
  private createPlayerStatsByGameTeamLoader(): DataLoader<
    string,
    PlayerFullStats[]
  > {
    return this.createLoader<string, PlayerFullStats[]>(
      'playerStatsByGameTeamLoader',
      async (gameTeamIds) => {
        // Load stats in parallel
        const results = await Promise.allSettled(
          gameTeamIds.map((id) =>
            this.statsService.getPlayerStatsByGameTeamId(id),
          ),
        );

        return results.map((result, idx) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          // Return empty array on error instead of throwing
          // This allows partial success when some teams have issues
          return [];
        });
      },
    );
  }

  /**
   * Batch loads period timing info by composite key "gameId:durationMinutes".
   *
   * This loader is used by the three timing field resolvers (currentPeriod,
   * currentPeriodSecond, serverTimestamp) to share a single service call
   * when all three fields are queried together.
   */
  private createPeriodTimingInfoLoader(): DataLoader<string, PeriodTimingInfo> {
    return this.createLoader<string, PeriodTimingInfo>(
      'periodTimingInfoLoader',
      async (keys) => {
        // Parse composite keys and load timing info in parallel
        const results = await Promise.allSettled(
          keys.map((key) => {
            const [gameId, durationStr] = key.split(':');
            const durationMinutes = durationStr
              ? parseInt(durationStr, 10)
              : 60;
            return this.gameTimingService.getPeriodTimingInfo(
              gameId,
              durationMinutes,
            );
          }),
        );

        return results.map((result, idx) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          // Return default timing info on error
          return {
            period1DurationSeconds: 0,
            period2DurationSeconds: 0,
            currentPeriod: undefined,
            currentPeriodSeconds: 0,
            serverTimestamp: Date.now(),
          };
        });
      },
    );
  }

  // ============================================================
  // User DataLoader
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

  // ============================================================
  // Team Membership DataLoaders (New Unified Model)
  // ============================================================

  /**
   * Batch loads TeamMembers by their IDs.
   * Includes user and roles relations for complete membership data.
   */
  private createTeamMemberLoader(): DataLoader<string, TeamMember> {
    return this.createLoader<string, TeamMember>(
      'teamMemberLoader',
      async (memberIds) => {
        const members = await this.teamMemberRepository.find({
          where: { id: In([...memberIds]) },
          relations: ['user', 'team', 'roles'],
        });

        const memberMap = new Map(members.map((m) => [m.id, m]));
        return memberIds.map(
          (id) => memberMap.get(id) || new Error(`TeamMember not found: ${id}`),
        );
      },
    );
  }

  /**
   * Batch loads TeamMembers by teamId.
   * Returns all active members for each team with their roles and user data.
   *
   * This replaces the old teamPlayersByTeamIdLoader and teamCoachesByTeamIdLoader.
   */
  private createTeamMembersByTeamIdLoader(): DataLoader<string, TeamMember[]> {
    return this.createLoader<string, TeamMember[]>(
      'teamMembersByTeamIdLoader',
      async (teamIds) => {
        const members = await this.teamMemberRepository.find({
          where: { teamId: In([...teamIds]), isActive: true },
          relations: ['user', 'roles'],
        });

        // Group by teamId
        const membersMap = new Map<string, TeamMember[]>();
        for (const member of members) {
          const existing = membersMap.get(member.teamId) || [];
          existing.push(member);
          membersMap.set(member.teamId, existing);
        }

        return teamIds.map((id) => membersMap.get(id) || []);
      },
    );
  }

  /**
   * Batch loads TeamMembers by userId.
   * Returns all active memberships for each user with their roles and team data.
   *
   * This replaces the old teamPlayersByUserIdLoader and teamCoachesByUserIdLoader.
   */
  private createTeamMembersByUserIdLoader(): DataLoader<string, TeamMember[]> {
    return this.createLoader<string, TeamMember[]>(
      'teamMembersByUserIdLoader',
      async (userIds) => {
        const members = await this.teamMemberRepository.find({
          where: { userId: In([...userIds]), isActive: true },
          relations: ['team', 'roles'],
        });

        // Group by userId
        const membersMap = new Map<string, TeamMember[]>();
        for (const member of members) {
          const existing = membersMap.get(member.userId) || [];
          existing.push(member);
          membersMap.set(member.userId, existing);
        }

        return userIds.map((id) => membersMap.get(id) || []);
      },
    );
  }

  /**
   * Batch loads TeamMemberRoles by teamMemberId.
   * Returns all roles for each team membership.
   */
  private createTeamMemberRolesByMemberIdLoader(): DataLoader<
    string,
    TeamMemberRole[]
  > {
    return this.createLoader<string, TeamMemberRole[]>(
      'teamMemberRolesByMemberIdLoader',
      async (memberIds) => {
        const roles = await this.teamMemberRoleRepository.find({
          where: { teamMemberId: In([...memberIds]) },
        });

        // Group by teamMemberId
        const rolesMap = new Map<string, TeamMemberRole[]>();
        for (const role of roles) {
          const existing = rolesMap.get(role.teamMemberId) || [];
          existing.push(role);
          rolesMap.set(role.teamMemberId, existing);
        }

        return memberIds.map((id) => rolesMap.get(id) || []);
      },
    );
  }
}
