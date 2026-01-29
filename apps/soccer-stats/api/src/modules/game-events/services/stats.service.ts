import { Injectable, NotFoundException } from '@nestjs/common';

import { GameEvent } from '../../../entities/game-event.entity';
import { Game } from '../../../entities/game.entity';
import { GameTimingService } from '../../games/game-timing.service';
import {
  PlayerPositionStats,
  PositionTime,
} from '../dto/player-position-stats.output';
import { PlayerFullStats } from '../dto/player-full-stats.output';
import { PlayerStatsInput } from '../dto/player-stats.input';

import { EventCoreService } from './event-core.service';

/**
 * Service responsible for player statistics calculations.
 * Handles position-time tracking and comprehensive player stats.
 */
@Injectable()
export class StatsService {
  constructor(
    private readonly coreService: EventCoreService,
    private readonly gameTimingService: GameTimingService,
  ) {}

  private get gameEventsRepository() {
    return this.coreService.gameEventsRepository;
  }

  private get gameTeamsRepository() {
    return this.coreService.gameTeamsRepository;
  }

  private get gamesRepository() {
    return this.coreService.gamesRepository;
  }

  private get teamsRepository() {
    return this.coreService.teamsRepository;
  }

  async getPlayerPositionStats(
    gameTeamId: string,
  ): Promise<PlayerPositionStats[]> {
    const gameTeam = await this.gameTeamsRepository.findOne({
      where: { id: gameTeamId },
      relations: ['game'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    const game = await this.gamesRepository.findOne({
      where: { id: gameTeam.gameId },
    });

    if (!game) {
      throw new NotFoundException(`Game not found for GameTeam ${gameTeamId}`);
    }

    // Get all events for this game team
    const events = await this.gameEventsRepository.find({
      where: { gameTeamId },
      relations: ['eventType', 'player'],
    });

    // Sort events by period first, then by periodSecond within each period
    // This ensures period 1 events come before period 2 events
    // Events without a period (like STARTING_LINEUP) are treated as period 0
    events.sort((a, b) => {
      const periodA = a.period ?? '0';
      const periodB = b.period ?? '0';
      if (periodA !== periodB) {
        return periodA.localeCompare(periodB);
      }
      if (a.periodSecond !== b.periodSecond) {
        return a.periodSecond - b.periodSecond;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Get current game time in seconds from timing service
    const currentGameSeconds =
      await this.gameTimingService.getGameDurationSeconds(
        game.id,
        game.format?.durationMinutes,
      );

    // Track player position time spans
    type PlayerTimeSpan = {
      playerId?: string;
      playerName?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      spans: Array<{
        position: string;
        startSeconds: number;
        endSeconds?: number;
      }>;
    };

    const playerTimeMap: Map<string, PlayerTimeSpan> = new Map();

    // Process events to build time spans
    for (const event of events) {
      const playerKey = event.playerId || event.externalPlayerName || event.id;
      const playerName = event.player
        ? `${event.player.firstName || ''} ${
            event.player.lastName || ''
          }`.trim() || event.player.email
        : undefined;

      // Use periodSecond for time within each period
      const eventSeconds = event.periodSecond;

      let playerData = playerTimeMap.get(playerKey);
      if (!playerData) {
        playerData = {
          playerId: event.playerId,
          playerName,
          externalPlayerName: event.externalPlayerName,
          externalPlayerNumber: event.externalPlayerNumber,
          spans: [],
        };
        playerTimeMap.set(playerKey, playerData);
      }

      switch (event.eventType.name) {
        case 'STARTING_LINEUP':
          // Player starts at this position from minute 0
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: 0,
            });
          }
          break;

        case 'SUBSTITUTION_IN':
          // Player enters at this position
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: eventSeconds,
            });
          }
          break;

        case 'SUBSTITUTION_OUT': {
          // Close any open span for this player
          const openSpan = playerData.spans.find(
            (s) => s.endSeconds === undefined,
          );
          if (openSpan) {
            openSpan.endSeconds = eventSeconds;
          }
          break;
        }

        case 'POSITION_SWAP':
        case 'POSITION_CHANGE': {
          // Close current span and start new one with new position
          const currentSpan = playerData.spans.find(
            (s) => s.endSeconds === undefined,
          );
          if (currentSpan) {
            currentSpan.endSeconds = eventSeconds;
          }
          if (event.position) {
            playerData.spans.push({
              position: event.position,
              startSeconds: eventSeconds,
            });
          }
          break;
        }
      }
    }

    // Calculate stats for each player
    const stats: PlayerPositionStats[] = [];

    for (const [, playerData] of playerTimeMap) {
      const positionTimeMap: Map<string, number> = new Map();
      let totalSeconds = 0;

      for (const span of playerData.spans) {
        const endSeconds = span.endSeconds ?? currentGameSeconds;
        const duration = Math.max(0, endSeconds - span.startSeconds);

        totalSeconds += duration;

        const currentPositionTime = positionTimeMap.get(span.position) || 0;
        positionTimeMap.set(span.position, currentPositionTime + duration);
      }

      // Only include players who have played
      if (totalSeconds > 0) {
        const positionTimes: PositionTime[] = [];
        for (const [position, seconds] of positionTimeMap) {
          positionTimes.push({
            position,
            minutes: Math.floor(seconds / 60),
            seconds: seconds % 60,
          });
        }

        // Sort by time played (descending)
        positionTimes.sort(
          (a, b) => b.minutes * 60 + b.seconds - (a.minutes * 60 + a.seconds),
        );

        stats.push({
          playerId: playerData.playerId,
          playerName: playerData.playerName,
          externalPlayerName: playerData.externalPlayerName,
          externalPlayerNumber: playerData.externalPlayerNumber,
          totalMinutes: Math.floor(totalSeconds / 60),
          totalSeconds: totalSeconds % 60,
          positionTimes,
        });
      }
    }

    // Sort by total time played (descending)
    stats.sort(
      (a, b) =>
        b.totalMinutes * 60 +
        b.totalSeconds -
        (a.totalMinutes * 60 + a.totalSeconds),
    );

    return stats;
  }

  /**
   * Get comprehensive player statistics with flexible filtering
   * @param input - Filter options: teamId (required), gameId (optional), startDate/endDate (optional)
   * @returns Array of player stats with playing time, goals, assists, and games played
   */
  async getPlayerStats(input: PlayerStatsInput): Promise<PlayerFullStats[]> {
    // Verify team exists
    const team = await this.teamsRepository.findOne({
      where: { id: input.teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team ${input.teamId} not found`);
    }

    // Build query for game teams
    const gameTeamsQuery = this.gameTeamsRepository
      .createQueryBuilder('gt')
      .innerJoinAndSelect('gt.game', 'g')
      .where('gt.teamId = :teamId', { teamId: input.teamId });

    // Apply filters
    if (input.gameId) {
      gameTeamsQuery.andWhere('g.id = :gameId', { gameId: input.gameId });
    } else if (input.startDate && input.endDate) {
      gameTeamsQuery.andWhere(
        'g.scheduledStart BETWEEN :startDate AND :endDate',
        {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      );
    }
    // If neither gameId nor dates: no additional filter (all-time stats)

    const gameTeams = await gameTeamsQuery.getMany();

    if (gameTeams.length === 0) {
      return [];
    }

    const gameTeamIds = gameTeams.map((gt) => gt.id);
    const gameMap = new Map<string, Game>();
    gameTeams.forEach((gt) => gameMap.set(gt.id, gt.game));

    // Get all events for these game teams
    const events = await this.gameEventsRepository
      .createQueryBuilder('ge')
      .innerJoinAndSelect('ge.eventType', 'et')
      .leftJoinAndSelect('ge.player', 'p')
      .where('ge.gameTeamId IN (:...gameTeamIds)', { gameTeamIds })
      .orderBy('ge.gameTeamId', 'ASC')
      .addOrderBy('ge.period', 'ASC')
      .addOrderBy('ge.periodSecond', 'ASC')
      .addOrderBy('ge.createdAt', 'ASC')
      .getMany();

    // Track aggregated stats per player
    type PlayerAggregatedStats = {
      playerId?: string;
      playerName?: string;
      externalPlayerName?: string;
      externalPlayerNumber?: string;
      totalSeconds: number;
      positionSecondsMap: Map<string, number>;
      goals: number;
      assists: number;
      gamesPlayed: Set<string>; // Set of gameTeamIds they participated in
      // For live time tracking (only relevant when filtering by single gameId)
      isOnField?: boolean;
      lastEntryGameSeconds?: number;
    };

    const playerStatsMap: Map<string, PlayerAggregatedStats> = new Map();

    // Helper to get or create player stats entry
    const getPlayerStats = (event: GameEvent): PlayerAggregatedStats => {
      const playerKey = event.playerId || event.externalPlayerName || event.id;
      let stats = playerStatsMap.get(playerKey);
      if (!stats) {
        const playerName = event.player
          ? `${event.player.firstName || ''} ${
              event.player.lastName || ''
            }`.trim() || event.player.email
          : undefined;
        stats = {
          playerId: event.playerId,
          playerName,
          externalPlayerName: event.externalPlayerName,
          externalPlayerNumber: event.externalPlayerNumber,
          totalSeconds: 0,
          positionSecondsMap: new Map(),
          goals: 0,
          assists: 0,
          gamesPlayed: new Set(),
        };
        playerStatsMap.set(playerKey, stats);
      }
      return stats;
    };

    // Group events by gameTeamId for processing
    const eventsByGameTeam = new Map<string, GameEvent[]>();
    for (const event of events) {
      const gameTeamEvents = eventsByGameTeam.get(event.gameTeamId) || [];
      gameTeamEvents.push(event);
      eventsByGameTeam.set(event.gameTeamId, gameTeamEvents);
    }

    // Sort events within each game team by period, then by periodSecond
    // This ensures period 1 events come before period 2 events
    for (const [, gameTeamEvents] of eventsByGameTeam) {
      gameTeamEvents.sort((a, b) => {
        const periodA = a.period ?? '0';
        const periodB = b.period ?? '0';
        if (periodA !== periodB) {
          return periodA.localeCompare(periodB);
        }
        if (a.periodSecond !== b.periodSecond) {
          return a.periodSecond - b.periodSecond;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }

    // Process events for each game team
    for (const [gameTeamId, gameTeamEvents] of eventsByGameTeam) {
      const game = gameMap.get(gameTeamId);
      if (!game) continue;

      const currentGameSeconds =
        await this.gameTimingService.getGameDurationSeconds(
          game.id,
          game.format?.durationMinutes,
        );

      // Track open spans for this game
      type PlayerSpan = {
        position: string;
        startSeconds: number;
      };
      const playerOpenSpans: Map<string, PlayerSpan | null> = new Map();

      for (const event of gameTeamEvents) {
        const playerKey =
          event.playerId || event.externalPlayerName || event.id;
        const playerStats = getPlayerStats(event);
        // Use periodSecond for time within each period
        const eventSeconds = event.periodSecond;

        switch (event.eventType.name) {
          case 'STARTING_LINEUP':
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: 0,
              });
              playerStats.gamesPlayed.add(gameTeamId);
            }
            break;

          case 'SUBSTITUTION_IN':
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: eventSeconds,
              });
              playerStats.gamesPlayed.add(gameTeamId);
            }
            break;

          case 'SUBSTITUTION_OUT': {
            const openSpan = playerOpenSpans.get(playerKey);
            if (openSpan) {
              const duration = Math.max(
                0,
                eventSeconds - openSpan.startSeconds,
              );
              playerStats.totalSeconds += duration;
              const currentPositionTime =
                playerStats.positionSecondsMap.get(openSpan.position) || 0;
              playerStats.positionSecondsMap.set(
                openSpan.position,
                currentPositionTime + duration,
              );
              playerOpenSpans.set(playerKey, null);
            }
            break;
          }

          case 'POSITION_SWAP':
          case 'POSITION_CHANGE': {
            const openSpan = playerOpenSpans.get(playerKey);
            if (openSpan) {
              // Close current span
              const duration = Math.max(
                0,
                eventSeconds - openSpan.startSeconds,
              );
              playerStats.totalSeconds += duration;
              const currentPositionTime =
                playerStats.positionSecondsMap.get(openSpan.position) || 0;
              playerStats.positionSecondsMap.set(
                openSpan.position,
                currentPositionTime + duration,
              );
            }
            // Start new span with new position
            if (event.position) {
              playerOpenSpans.set(playerKey, {
                position: event.position,
                startSeconds: eventSeconds,
              });
            }
            break;
          }

          case 'GOAL':
            playerStats.goals += 1;
            playerStats.gamesPlayed.add(gameTeamId);
            break;

          case 'ASSIST':
            playerStats.assists += 1;
            playerStats.gamesPlayed.add(gameTeamId);
            break;

          case 'BENCH':
            // Player on bench - mark as participating in game but not playing
            playerStats.gamesPlayed.add(gameTeamId);
            break;
        }
      }

      // Close any open spans at end of game and track on-field status
      for (const [playerKey, openSpan] of playerOpenSpans) {
        if (openSpan) {
          const playerStats = playerStatsMap.get(playerKey);
          if (playerStats) {
            const duration = Math.max(
              0,
              currentGameSeconds - openSpan.startSeconds,
            );
            playerStats.totalSeconds += duration;
            const currentPositionTime =
              playerStats.positionSecondsMap.get(openSpan.position) || 0;
            playerStats.positionSecondsMap.set(
              openSpan.position,
              currentPositionTime + duration,
            );
            // Track that this player is still on field (for single-game stats)
            // Only meaningful when filtering by a single gameId
            if (input.gameId) {
              playerStats.isOnField = true;
              playerStats.lastEntryGameSeconds = openSpan.startSeconds;
            }
          }
        }
      }
    }

    // Convert to PlayerFullStats array
    const results: PlayerFullStats[] = [];

    for (const [, playerStats] of playerStatsMap) {
      // Skip players who never participated (shouldn't happen, but just in case)
      if (playerStats.gamesPlayed.size === 0) continue;

      const positionTimes: PositionTime[] = [];
      for (const [position, seconds] of playerStats.positionSecondsMap) {
        positionTimes.push({
          position,
          minutes: Math.floor(seconds / 60),
          seconds: seconds % 60,
        });
      }

      // Sort by time played (descending)
      positionTimes.sort(
        (a, b) => b.minutes * 60 + b.seconds - (a.minutes * 60 + a.seconds),
      );

      results.push({
        playerId: playerStats.playerId,
        playerName: playerStats.playerName,
        externalPlayerName: playerStats.externalPlayerName,
        externalPlayerNumber: playerStats.externalPlayerNumber,
        totalMinutes: Math.floor(playerStats.totalSeconds / 60),
        totalSeconds: playerStats.totalSeconds % 60,
        positionTimes,
        goals: playerStats.goals,
        assists: playerStats.assists,
        gamesPlayed: playerStats.gamesPlayed.size,
        isOnField: playerStats.isOnField,
        lastEntryGameSeconds: playerStats.lastEntryGameSeconds,
      });
    }

    // Sort by total time played (descending)
    results.sort(
      (a, b) =>
        b.totalMinutes * 60 +
        b.totalSeconds -
        (a.totalMinutes * 60 + a.totalSeconds),
    );

    return results;
  }
}
