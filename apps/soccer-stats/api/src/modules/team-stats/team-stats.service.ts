import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Team } from '../../entities/team.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameEventsService } from '../game-events/game-events.service';

import { TeamStatsInput } from './dto/team-stats-input';
import { TeamStatsResponse } from './dto/team-stats-response.output';
import { TeamAggregateStats } from './dto/team-aggregate-stats.output';
import { PlayerGameStatsRow } from './dto/player-game-stats-row.output';
import { GameStatsSummary } from './dto/game-stats-summary.output';

type SquadSnapshotStats = {
  players: string[];
  goalsFor: number;
  goalsAgainst: number;
  goalEvents: number;
};

type RankedSquadMetric = {
  squad: string;
  goalsFor: number;
  goalsAgainst: number;
};

type ComboMetric = {
  scorer: string;
  assister: string;
  goals: number;
};

@Injectable()
export class TeamStatsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    private readonly gameEventsService: GameEventsService,
  ) {}

  async getTeamStats(input: TeamStatsInput): Promise<TeamStatsResponse> {
    const team = await this.teamRepository.findOne({
      where: { id: input.teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team ${input.teamId} not found`);
    }

    // Get player stats from the existing StatsService (handles time tracking)
    const playerFullStats = await this.gameEventsService.getPlayerStats({
      teamId: input.teamId,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    // Build player stats rows
    const playerStats: PlayerGameStatsRow[] = playerFullStats.map((ps) => ({
      playerId: ps.playerId,
      playerName: ps.playerName,
      externalPlayerName: ps.externalPlayerName,
      externalPlayerNumber: ps.externalPlayerNumber,
      goals: ps.goals,
      unassistedGoals: ps.unassistedGoals ?? 0,
      assists: ps.assists,
      yellowCards: ps.yellowCards ?? 0,
      redCards: ps.redCards ?? 0,
      ownGoals: 0,
      totalMinutes: ps.totalMinutes,
      totalSeconds: ps.totalSeconds,
      gamesPlayed: ps.gamesPlayed,
    }));

    // Get aggregate stats from the view
    const aggregateStats = await this.getAggregateStats(input);

    // Get per-game breakdown
    const gameBreakdown = await this.getGameBreakdown(input);

    return {
      teamId: input.teamId,
      teamName: team.name,
      aggregateStats,
      playerStats,
      gameBreakdown,
    };
  }

  async getAggregateStats(input: TeamStatsInput): Promise<TeamAggregateStats> {
    // Build query against game_teams with opponent join
    let query = this.gameTeamRepository
      .createQueryBuilder('gt')
      .innerJoin('gt.game', 'g')
      .leftJoin(
        'game_teams',
        'opp_gt',
        'opp_gt."gameId" = gt."gameId" AND opp_gt.id != gt.id',
      )
      .where('gt."teamId" = :teamId', { teamId: input.teamId })
      .andWhere(
        "g.status IN ('COMPLETED', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'IN_PROGRESS')",
      );

    if (input.startDate && input.endDate) {
      query = query.andWhere(
        'g."scheduledStart" BETWEEN :startDate AND :endDate',
        { startDate: input.startDate, endDate: input.endDate },
      );
    }

    const result = await query
      .select('COUNT(DISTINCT gt.id)', 'gamesPlayed')
      .addSelect(
        `COUNT(DISTINCT gt.id) FILTER (WHERE gt."finalScore" IS NOT NULL AND opp_gt."finalScore" IS NOT NULL AND gt."finalScore" > opp_gt."finalScore")`,
        'wins',
      )
      .addSelect(
        `COUNT(DISTINCT gt.id) FILTER (WHERE gt."finalScore" IS NOT NULL AND opp_gt."finalScore" IS NOT NULL AND gt."finalScore" = opp_gt."finalScore")`,
        'draws',
      )
      .addSelect(
        `COUNT(DISTINCT gt.id) FILTER (WHERE gt."finalScore" IS NOT NULL AND opp_gt."finalScore" IS NOT NULL AND gt."finalScore" < opp_gt."finalScore")`,
        'losses',
      )
      .addSelect('COALESCE(SUM(gt."finalScore"), 0)', 'goalsFor')
      .addSelect('COALESCE(SUM(opp_gt."finalScore"), 0)', 'goalsAgainst')
      .getRawOne();

    const gamesPlayed = parseInt(result?.gamesPlayed ?? '0', 10);
    const wins = parseInt(result?.wins ?? '0', 10);
    const draws = parseInt(result?.draws ?? '0', 10);
    const losses = parseInt(result?.losses ?? '0', 10);
    const goalsFor = parseInt(result?.goalsFor ?? '0', 10);
    const goalsAgainst = parseInt(result?.goalsAgainst ?? '0', 10);

    // Get total assists and cards from events
    const eventCounts = await this.getEventCounts(input);

    // Compute on-field squad metrics from lineup and goal events
    const squadMetrics = await this.getOnFieldSquadMetrics(input);

    // Compute top scorer+assister combinations
    const topComboPlayers = await this.getTopComboPlayers(input);

    return {
      gamesPlayed,
      wins,
      draws,
      losses,
      winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      totalAssists: eventCounts.assists,
      totalYellowCards: eventCounts.yellowCards,
      totalRedCards: eventCounts.redCards,
      topScoringSquad: squadMetrics.topScoringSquad,
      topScoringSquadGoalsFor: squadMetrics.topScoringSquadGoalsFor,
      topDefensiveSquad: squadMetrics.topDefensiveSquad,
      topDefensiveSquadGoalsAgainst: squadMetrics.topDefensiveSquadGoalsAgainst,
      topScoringSquads: squadMetrics.topScoringSquads,
      topDefensiveSquads: squadMetrics.topDefensiveSquads,
      topComboPlayers,
    };
  }

  private async getTopComboPlayers(
    input: TeamStatsInput,
  ): Promise<ComboMetric[]> {
    let query = this.gameTeamRepository.manager
      .createQueryBuilder()
      .select(
        `COALESCE(
          CASE
            WHEN goal."playerId" IS NOT NULL
              THEN COALESCE(TRIM(CONCAT(goal_user."firstName", ' ', goal_user."lastName")), goal_user.email)
            ELSE goal."externalPlayerName"
          END,
          'Unknown Scorer'
        )`,
        'scorer',
      )
      .addSelect(
        `COALESCE(
          CASE
            WHEN assist."playerId" IS NOT NULL
              THEN COALESCE(TRIM(CONCAT(assist_user."firstName", ' ', assist_user."lastName")), assist_user.email)
            ELSE assist."externalPlayerName"
          END,
          'Unknown Assister'
        )`,
        'assister',
      )
      .addSelect('COUNT(*)', 'goals')
      .from('game_events', 'assist')
      .innerJoin(
        'event_types',
        'assist_type',
        'assist_type.id = assist."eventTypeId"',
      )
      .innerJoin('game_events', 'goal', 'goal.id = assist."parentEventId"')
      .innerJoin(
        'event_types',
        'goal_type',
        'goal_type.id = goal."eventTypeId"',
      )
      .innerJoin('game_teams', 'gt', 'gt.id = goal."gameTeamId"')
      .innerJoin('games', 'g', 'g.id = gt."gameId"')
      .leftJoin('users', 'goal_user', 'goal_user.id = goal."playerId"')
      .leftJoin('users', 'assist_user', 'assist_user.id = assist."playerId"')
      .where('assist_type.name = :assistType', { assistType: 'ASSIST' })
      .andWhere('goal_type.name = :goalType', { goalType: 'GOAL' })
      .andWhere('gt."teamId" = :teamId', { teamId: input.teamId })
      .groupBy('goal."playerId"')
      .addGroupBy('goal_user."firstName"')
      .addGroupBy('goal_user."lastName"')
      .addGroupBy('goal_user.email')
      .addGroupBy('goal."externalPlayerName"')
      .addGroupBy('assist."playerId"')
      .addGroupBy('assist_user."firstName"')
      .addGroupBy('assist_user."lastName"')
      .addGroupBy('assist_user.email')
      .addGroupBy('assist."externalPlayerName"')
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('scorer', 'ASC')
      .addOrderBy('assister', 'ASC')
      .limit(3);

    if (input.startDate && input.endDate) {
      query = query.andWhere(
        'g."scheduledStart" BETWEEN :startDate AND :endDate',
        {
          startDate: input.startDate,
          endDate: input.endDate,
        },
      );
    }

    const rows = await query.getRawMany<{
      scorer: string;
      assister: string;
      goals: string;
    }>();

    return rows.map((row) => ({
      scorer: row.scorer,
      assister: row.assister,
      goals: parseInt(row.goals, 10),
    }));
  }

  private periodSortValue(period?: string): number {
    if (!period) return 0;

    if (/^\d+$/.test(period)) {
      return parseInt(period, 10);
    }

    if (period.startsWith('OT')) {
      const suffix = period.replace('OT', '');
      const otNum = /^\d+$/.test(suffix) ? parseInt(suffix, 10) : 1;
      return 100 + otNum;
    }

    return 999;
  }

  private buildPlayerKey(event: {
    playerId?: string | null;
    externalPlayerName?: string | null;
    id: string;
  }): string {
    return event.playerId ?? event.externalPlayerName ?? event.id;
  }

  private buildPlayerDisplayName(event: {
    playerId?: string | null;
    playerName?: string | null;
    externalPlayerName?: string | null;
  }): string {
    return event.playerName ?? event.externalPlayerName ?? 'Unknown Player';
  }

  private snapshotKey(lineup: Map<string, string>): {
    key: string;
    players: string[];
  } {
    const players = Array.from(lineup.values()).sort((a, b) =>
      a.localeCompare(b),
    );
    return {
      key: players.join(' | '),
      players,
    };
  }

  private async getOnFieldSquadMetrics(input: TeamStatsInput): Promise<{
    topScoringSquad?: string;
    topScoringSquadGoalsFor: number;
    topDefensiveSquad?: string;
    topDefensiveSquadGoalsAgainst: number;
    topScoringSquads: RankedSquadMetric[];
    topDefensiveSquads: RankedSquadMetric[];
  }> {
    let gameTeamsQuery = this.gameTeamRepository
      .createQueryBuilder('gt')
      .innerJoin('gt.game', 'g')
      .where('gt."teamId" = :teamId', { teamId: input.teamId })
      .andWhere(
        "g.status IN ('COMPLETED', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'IN_PROGRESS')",
      );

    if (input.startDate && input.endDate) {
      gameTeamsQuery = gameTeamsQuery.andWhere(
        'g."scheduledStart" BETWEEN :startDate AND :endDate',
        { startDate: input.startDate, endDate: input.endDate },
      );
    }

    const ourGameTeams = await gameTeamsQuery.getMany();

    if (ourGameTeams.length === 0) {
      return {
        topScoringSquadGoalsFor: 0,
        topDefensiveSquadGoalsAgainst: 0,
        topScoringSquads: [],
        topDefensiveSquads: [],
      };
    }

    const gameIds = ourGameTeams.map((gt) => gt.gameId);
    const ourByGameId = new Map(ourGameTeams.map((gt) => [gt.gameId, gt]));

    const allGameTeams = await this.gameTeamRepository
      .createQueryBuilder('gt')
      .where('gt."gameId" IN (:...gameIds)', { gameIds })
      .getMany();

    const opponentByGameId = new Map<string, GameTeam>();
    for (const gt of allGameTeams) {
      const our = ourByGameId.get(gt.gameId);
      if (!our) continue;
      if (gt.id !== our.id) {
        opponentByGameId.set(gt.gameId, gt);
      }
    }

    const relevantGameTeamIds = [
      ...ourGameTeams.map((gt) => gt.id),
      ...Array.from(opponentByGameId.values()).map((gt) => gt.id),
    ];

    if (relevantGameTeamIds.length === 0) {
      return {
        topScoringSquadGoalsFor: 0,
        topDefensiveSquadGoalsAgainst: 0,
        topScoringSquads: [],
        topDefensiveSquads: [],
      };
    }

    const rawEvents = await this.gameTeamRepository.manager
      .createQueryBuilder()
      .select('ge.id', 'id')
      .addSelect('ge."gameTeamId"', 'gameTeamId')
      .addSelect('gt."gameId"', 'gameId')
      .addSelect('ge."playerId"', 'playerId')
      .addSelect('ge."externalPlayerName"', 'externalPlayerName')
      .addSelect(
        `CASE
          WHEN ge."playerId" IS NOT NULL
            THEN COALESCE(TRIM(CONCAT(u."firstName", ' ', u."lastName")), u.email)
          ELSE NULL
        END`,
        'playerName',
      )
      .addSelect('ge.period', 'period')
      .addSelect('ge."periodSecond"', 'periodSecond')
      .addSelect('ge."createdAt"', 'createdAt')
      .addSelect('et.name', 'eventType')
      .from('game_events', 'ge')
      .innerJoin('event_types', 'et', 'et.id = ge."eventTypeId"')
      .innerJoin('game_teams', 'gt', 'gt.id = ge."gameTeamId"')
      .leftJoin('users', 'u', 'u.id = ge."playerId"')
      .where('ge."gameTeamId" IN (:...gameTeamIds)', {
        gameTeamIds: relevantGameTeamIds,
      })
      .andWhere("et.name IN ('SUBSTITUTION_IN', 'SUBSTITUTION_OUT', 'GOAL')")
      .getRawMany<{
        id: string;
        gameTeamId: string;
        gameId: string;
        playerId?: string | null;
        externalPlayerName?: string | null;
        playerName?: string | null;
        period?: string | null;
        periodSecond: string;
        createdAt: string;
        eventType: 'SUBSTITUTION_IN' | 'SUBSTITUTION_OUT' | 'GOAL';
      }>();

    const eventsByGameId = new Map<string, typeof rawEvents>();
    for (const event of rawEvents) {
      const gameEvents = eventsByGameId.get(event.gameId) ?? [];
      gameEvents.push(event);
      eventsByGameId.set(event.gameId, gameEvents);
    }

    const squadMap = new Map<string, SquadSnapshotStats>();

    for (const [gameId, events] of eventsByGameId) {
      const ourTeam = ourByGameId.get(gameId);
      const opponentTeam = opponentByGameId.get(gameId);
      if (!ourTeam || !opponentTeam) continue;

      events.sort((a, b) => {
        const periodA = this.periodSortValue(a.period ?? undefined);
        const periodB = this.periodSortValue(b.period ?? undefined);
        if (periodA !== periodB) return periodA - periodB;

        const secondA = parseInt(a.periodSecond ?? '0', 10);
        const secondB = parseInt(b.periodSecond ?? '0', 10);
        if (secondA !== secondB) return secondA - secondB;

        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

      const onFieldLineup = new Map<string, string>();

      for (const event of events) {
        if (event.gameTeamId === ourTeam.id) {
          if (event.eventType === 'SUBSTITUTION_IN') {
            const key = this.buildPlayerKey(event);
            onFieldLineup.set(key, this.buildPlayerDisplayName(event));
            continue;
          }

          if (event.eventType === 'SUBSTITUTION_OUT') {
            const key = this.buildPlayerKey(event);
            onFieldLineup.delete(key);
            continue;
          }
        }

        if (event.eventType !== 'GOAL') continue;

        const snapshot = this.snapshotKey(onFieldLineup);
        if (!snapshot.key) continue;

        const current = squadMap.get(snapshot.key) ?? {
          players: snapshot.players,
          goalsFor: 0,
          goalsAgainst: 0,
          goalEvents: 0,
        };

        if (event.gameTeamId === ourTeam.id) {
          current.goalsFor += 1;
          current.goalEvents += 1;
        }

        if (event.gameTeamId === opponentTeam.id) {
          current.goalsAgainst += 1;
          current.goalEvents += 1;
        }

        squadMap.set(snapshot.key, current);
      }
    }

    const squads = Array.from(squadMap.values());

    if (squads.length === 0) {
      return {
        topScoringSquadGoalsFor: 0,
        topDefensiveSquadGoalsAgainst: 0,
        topScoringSquads: [],
        topDefensiveSquads: [],
      };
    }

    const rankingByScoring = [...squads].sort((a, b) => {
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (a.goalsAgainst !== b.goalsAgainst)
        return a.goalsAgainst - b.goalsAgainst;
      return b.goalEvents - a.goalEvents;
    });

    const rankingByDefense = [...squads].sort((a, b) => {
      if (a.goalsAgainst !== b.goalsAgainst)
        return a.goalsAgainst - b.goalsAgainst;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return b.goalEvents - a.goalEvents;
    });

    const topScoring = rankingByScoring.at(0);

    const topDefensive = rankingByDefense.at(0);

    const topScoringSquads: RankedSquadMetric[] = rankingByScoring
      .slice(0, 3)
      .map((squad) => ({
        squad: squad.players.join(', '),
        goalsFor: squad.goalsFor,
        goalsAgainst: squad.goalsAgainst,
      }));

    const topDefensiveSquads: RankedSquadMetric[] = rankingByDefense
      .slice(0, 3)
      .map((squad) => ({
        squad: squad.players.join(', '),
        goalsFor: squad.goalsFor,
        goalsAgainst: squad.goalsAgainst,
      }));

    return {
      topScoringSquad: topScoring?.players.join(', '),
      topScoringSquadGoalsFor: topScoring?.goalsFor ?? 0,
      topDefensiveSquad: topDefensive?.players.join(', '),
      topDefensiveSquadGoalsAgainst: topDefensive?.goalsAgainst ?? 0,
      topScoringSquads,
      topDefensiveSquads,
    };
  }

  private async getEventCounts(
    input: TeamStatsInput,
  ): Promise<{ assists: number; yellowCards: number; redCards: number }> {
    let query = this.gameTeamRepository.manager
      .createQueryBuilder()
      .select(`COUNT(*) FILTER (WHERE et.name = 'ASSIST')`, 'assists')
      .addSelect(
        `COUNT(*) FILTER (WHERE et.name = 'YELLOW_CARD')`,
        'yellowCards',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE et.name IN ('RED_CARD', 'SECOND_YELLOW'))`,
        'redCards',
      )
      .from('game_events', 'ge')
      .innerJoin('event_types', 'et', 'et.id = ge."eventTypeId"')
      .innerJoin('game_teams', 'gt', 'gt.id = ge."gameTeamId"')
      .innerJoin('games', 'g', 'g.id = gt."gameId"')
      .where('gt."teamId" = :teamId', { teamId: input.teamId });

    if (input.startDate && input.endDate) {
      query = query.andWhere(
        'g."scheduledStart" BETWEEN :startDate AND :endDate',
        { startDate: input.startDate, endDate: input.endDate },
      );
    }

    const result = await query.getRawOne();

    return {
      assists: parseInt(result?.assists ?? '0', 10),
      yellowCards: parseInt(result?.yellowCards ?? '0', 10),
      redCards: parseInt(result?.redCards ?? '0', 10),
    };
  }

  async getGameBreakdown(input: TeamStatsInput): Promise<GameStatsSummary[]> {
    // Get all game teams for this team
    let gameTeamsQuery = this.gameTeamRepository
      .createQueryBuilder('gt')
      .innerJoinAndSelect('gt.game', 'g')
      .leftJoinAndSelect('gt.team', 't')
      .where('gt."teamId" = :teamId', { teamId: input.teamId })
      .andWhere(
        "g.status IN ('COMPLETED', 'FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'IN_PROGRESS')",
      )
      .orderBy('g."scheduledStart"', 'DESC');

    if (input.startDate && input.endDate) {
      gameTeamsQuery = gameTeamsQuery.andWhere(
        'g."scheduledStart" BETWEEN :startDate AND :endDate',
        { startDate: input.startDate, endDate: input.endDate },
      );
    }

    const gameTeams = await gameTeamsQuery.getMany();

    if (gameTeams.length === 0) {
      return [];
    }

    // Get opponent info for each game
    const gameIds = gameTeams.map((gt) => gt.gameId);
    const opponentTeams = await this.gameTeamRepository
      .createQueryBuilder('gt')
      .innerJoinAndSelect('gt.team', 't')
      .where('gt."gameId" IN (:...gameIds)', { gameIds })
      .andWhere('gt."teamId" != :teamId', { teamId: input.teamId })
      .getMany();

    const opponentByGameId = new Map(
      opponentTeams.map((opp) => [opp.gameId, opp]),
    );

    // Build per-game summaries with player stats from the existing service
    const summaries: GameStatsSummary[] = [];

    for (const gameTeam of gameTeams) {
      const opponent = opponentByGameId.get(gameTeam.gameId);

      // Get player stats for this specific game
      const playerFullStats = await this.gameEventsService.getPlayerStats({
        teamId: input.teamId,
        gameId: gameTeam.gameId,
      });

      const playerStats: PlayerGameStatsRow[] = playerFullStats.map((ps) => ({
        playerId: ps.playerId,
        playerName: ps.playerName,
        externalPlayerName: ps.externalPlayerName,
        externalPlayerNumber: ps.externalPlayerNumber,
        goals: ps.goals,
        unassistedGoals: ps.unassistedGoals ?? 0,
        assists: ps.assists,
        yellowCards: ps.yellowCards ?? 0,
        redCards: ps.redCards ?? 0,
        ownGoals: 0,
        totalMinutes: ps.totalMinutes,
        totalSeconds: ps.totalSeconds,
        gamesPlayed: 1,
      }));

      const totalGoals = playerStats.reduce((sum, ps) => sum + ps.goals, 0);
      const totalAssists = playerStats.reduce((sum, ps) => sum + ps.assists, 0);

      let result = 'N/A';
      if (
        gameTeam.finalScore !== null &&
        gameTeam.finalScore !== undefined &&
        opponent?.finalScore !== null &&
        opponent?.finalScore !== undefined
      ) {
        if (gameTeam.finalScore > opponent.finalScore) result = 'W';
        else if (gameTeam.finalScore < opponent.finalScore) result = 'L';
        else result = 'D';
      }

      summaries.push({
        gameId: gameTeam.gameId,
        gameTeamId: gameTeam.id,
        gameName: gameTeam.game?.name,
        gameDate: gameTeam.game?.scheduledStart,
        gameStatus: gameTeam.game?.status ?? 'UNKNOWN',
        opponentName: opponent?.team?.name,
        teamScore: gameTeam.finalScore,
        opponentScore: opponent?.finalScore,
        result,
        totalGoals,
        totalAssists,
        playerStats,
      });
    }

    return summaries;
  }

  async getGameTeamStats(gameTeamId: string): Promise<GameStatsSummary> {
    const gameTeam = await this.gameTeamRepository.findOne({
      where: { id: gameTeamId },
      relations: ['game', 'team'],
    });

    if (!gameTeam) {
      throw new NotFoundException(`GameTeam ${gameTeamId} not found`);
    }

    // Get opponent
    const opponent = await this.gameTeamRepository.findOne({
      where: { gameId: gameTeam.gameId },
      relations: ['team'],
    });

    const actualOpponent =
      opponent && opponent.id !== gameTeamId ? opponent : null;

    // Get player stats for this game
    const playerFullStats = await this.gameEventsService.getPlayerStats({
      teamId: gameTeam.teamId,
      gameId: gameTeam.gameId,
    });

    const playerStats: PlayerGameStatsRow[] = playerFullStats.map((ps) => ({
      playerId: ps.playerId,
      playerName: ps.playerName,
      externalPlayerName: ps.externalPlayerName,
      externalPlayerNumber: ps.externalPlayerNumber,
      goals: ps.goals,
      unassistedGoals: ps.unassistedGoals ?? 0,
      assists: ps.assists,
      yellowCards: ps.yellowCards ?? 0,
      redCards: ps.redCards ?? 0,
      ownGoals: 0,
      totalMinutes: ps.totalMinutes,
      totalSeconds: ps.totalSeconds,
      gamesPlayed: 1,
    }));

    const totalGoals = playerStats.reduce((sum, ps) => sum + ps.goals, 0);
    const totalAssists = playerStats.reduce((sum, ps) => sum + ps.assists, 0);

    let result = 'N/A';
    if (
      gameTeam.finalScore !== null &&
      gameTeam.finalScore !== undefined &&
      actualOpponent?.finalScore !== null &&
      actualOpponent?.finalScore !== undefined
    ) {
      if (gameTeam.finalScore > actualOpponent.finalScore) result = 'W';
      else if (gameTeam.finalScore < actualOpponent.finalScore) result = 'L';
      else result = 'D';
    }

    return {
      gameId: gameTeam.gameId,
      gameTeamId: gameTeam.id,
      gameName: gameTeam.game?.name,
      gameDate: gameTeam.game?.scheduledStart,
      gameStatus: gameTeam.game?.status ?? 'UNKNOWN',
      opponentName: actualOpponent?.team?.name,
      teamScore: gameTeam.finalScore,
      opponentScore: actualOpponent?.finalScore,
      result,
      totalGoals,
      totalAssists,
      playerStats,
    };
  }
}
