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
    };
  }

  private async getEventCounts(
    input: TeamStatsInput,
  ): Promise<{ assists: number; yellowCards: number; redCards: number }> {
    let query = this.gameTeamRepository.manager
      .createQueryBuilder()
      .select(
        `COUNT(*) FILTER (WHERE et.name = 'ASSIST')`,
        'assists',
      )
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
        assists: ps.assists,
        yellowCards: ps.yellowCards ?? 0,
        redCards: ps.redCards ?? 0,
        ownGoals: 0,
        totalMinutes: ps.totalMinutes,
        totalSeconds: ps.totalSeconds,
        gamesPlayed: 1,
      }));

      const totalGoals = playerStats.reduce((sum, ps) => sum + ps.goals, 0);
      const totalAssists = playerStats.reduce(
        (sum, ps) => sum + ps.assists,
        0,
      );

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

  async getGameTeamStats(
    gameTeamId: string,
  ): Promise<GameStatsSummary> {
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
