// Game History Storage Service
// Handles saving, loading, and managing completed games

import { ExportService } from './export.service';

export interface GameResult {
  id: string;
  date: string;
  homeTeam: {
    name: string;
    score: number;
    players: PlayerGameStats[];
  };
  awayTeam: {
    name: string;
    score: number;
    players: PlayerGameStats[];
  };
  duration: number; // Game time in seconds
  goals: GoalRecord[];
  substitutions: SubstitutionRecord[];
}

export interface PlayerGameStats {
  id: number;
  name: string;
  jersey: number;
  position: string;
  playTime: number;
  goals: number;
  assists: number;
  photo?: string;
}

export interface GoalRecord {
  id: string;
  timestamp: number;
  team: 'home' | 'away';
  scorerId: number;
  scorerName: string;
  assistId?: number;
  assistName?: string;
  realTime: string;
}

export interface SubstitutionRecord {
  id: string;
  timestamp: number;
  team: 'home' | 'away';
  playerOutId: number;
  playerOutName: string;
  playerInId: number;
  playerInName: string;
  realTime: string;
}

export interface SeasonStats {
  playerId: number;
  name: string;
  jersey: number;
  position: string;
  gamesPlayed: number;
  totalPlayTime: number;
  totalGoals: number;
  totalAssists: number;
  averagePlayTime: number;
  photo?: string;
}

class GameHistoryService {
  private readonly STORAGE_KEY = 'soccer-stats-game-history';
  private readonly SEASON_KEY = 'soccer-stats-season';

  // Game History Methods
  saveGame(gameResult: GameResult): void {
    const history = this.getGameHistory();
    history.push(gameResult);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    this.updateSeasonStats(gameResult);
  }

  getGameHistory(): GameResult[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  getGameById(gameId: string): GameResult | null {
    const history = this.getGameHistory();
    return history.find((game) => game.id === gameId) || null;
  }

  deleteGame(gameId: string): void {
    const history = this.getGameHistory();
    const filtered = history.filter((game) => game.id !== gameId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    this.recalculateSeasonStats();
  }

  clearGameHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SEASON_KEY);
  }

  // Season Statistics Methods
  private updateSeasonStats(gameResult: GameResult): void {
    const seasonStats = this.getSeasonStats();

    // Update stats for both teams
    this.updateTeamSeasonStats(seasonStats, gameResult.homeTeam.players);
    this.updateTeamSeasonStats(seasonStats, gameResult.awayTeam.players);

    localStorage.setItem(this.SEASON_KEY, JSON.stringify(seasonStats));
  }

  private updateTeamSeasonStats(
    seasonStats: Map<number, SeasonStats>,
    players: PlayerGameStats[]
  ): void {
    players.forEach((player) => {
      const existing = seasonStats.get(player.id);

      if (existing) {
        existing.gamesPlayed += 1;
        existing.totalPlayTime += player.playTime;
        existing.totalGoals += player.goals;
        existing.totalAssists += player.assists;
        existing.averagePlayTime =
          existing.totalPlayTime / existing.gamesPlayed;
      } else {
        seasonStats.set(player.id, {
          playerId: player.id,
          name: player.name,
          jersey: player.jersey,
          position: player.position,
          gamesPlayed: 1,
          totalPlayTime: player.playTime,
          totalGoals: player.goals,
          totalAssists: player.assists,
          averagePlayTime: player.playTime,
          photo: player.photo,
        });
      }
    });
  }

  getSeasonStats(): Map<number, SeasonStats> {
    const stored = localStorage.getItem(this.SEASON_KEY);
    if (!stored) return new Map();

    const statsArray: SeasonStats[] = JSON.parse(stored);
    return new Map(statsArray.map((stat) => [stat.playerId, stat]));
  }

  getSeasonStatsArray(): SeasonStats[] {
    const statsMap = this.getSeasonStats();
    return Array.from(statsMap.values()).sort(
      (a, b) => b.totalGoals - a.totalGoals
    );
  }

  private recalculateSeasonStats(): void {
    localStorage.removeItem(this.SEASON_KEY);
    const history = this.getGameHistory();
    history.forEach((game) => this.updateSeasonStats(game));
  }

  // Analytics Methods
  getPlayerAnalytics(playerId: number): {
    recentGames: PlayerGameStats[];
    trends: {
      goalsPerGame: number[];
      assistsPerGame: number[];
      playTimePerGame: number[];
    };
  } {
    const history = this.getGameHistory();
    const recentGames: PlayerGameStats[] = [];
    const goalsPerGame: number[] = [];
    const assistsPerGame: number[] = [];
    const playTimePerGame: number[] = [];

    history.slice(-10).forEach((game) => {
      const homePlayer = game.homeTeam.players.find((p) => p.id === playerId);
      const awayPlayer = game.awayTeam.players.find((p) => p.id === playerId);
      const player = homePlayer || awayPlayer;

      if (player) {
        recentGames.push(player);
        goalsPerGame.push(player.goals);
        assistsPerGame.push(player.assists);
        playTimePerGame.push(player.playTime / 60); // Convert to minutes
      }
    });

    return {
      recentGames,
      trends: {
        goalsPerGame,
        assistsPerGame,
        playTimePerGame,
      },
    };
  }

  getTeamAnalytics(): {
    winLossRecord: { wins: number; losses: number; draws: number };
    averageScore: number;
    topScorers: { name: string; goals: number }[];
    topAssists: { name: string; assists: number }[];
  } {
    const history = this.getGameHistory();
    const seasonStats = this.getSeasonStatsArray();

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let totalScore = 0;

    history.forEach((game) => {
      totalScore += game.homeTeam.score + game.awayTeam.score;

      if (game.homeTeam.score > game.awayTeam.score) {
        wins++;
      } else if (game.homeTeam.score < game.awayTeam.score) {
        losses++;
      } else {
        draws++;
      }
    });

    return {
      winLossRecord: { wins, losses, draws },
      averageScore: history.length > 0 ? totalScore / history.length : 0,
      topScorers: seasonStats
        .sort((a, b) => b.totalGoals - a.totalGoals)
        .slice(0, 5)
        .map((stat) => ({ name: stat.name, goals: stat.totalGoals })),
      topAssists: seasonStats
        .sort((a, b) => b.totalAssists - a.totalAssists)
        .slice(0, 5)
        .map((stat) => ({ name: stat.name, assists: stat.totalAssists })),
    };
  }

  // Export Methods
  exportGameReport(gameId: string): string {
    const game = this.getGameById(gameId);
    if (!game) return '';

    return ExportService.generateGameReport(game);
  }

  downloadGameReport(gameId: string): void {
    const game = this.getGameById(gameId);
    if (!game) return;

    const report = ExportService.generateGameReport(game);
    const filename = `game-report-${game.homeTeam.name}-vs-${
      game.awayTeam.name
    }-${new Date(game.date).toISOString().split('T')[0]}.txt`;
    ExportService.downloadTextFile(report, filename);
  }

  downloadGameCSV(gameId: string): void {
    const game = this.getGameById(gameId);
    if (!game) return;

    const csv = ExportService.generateGameCSV(game);
    const filename = `game-data-${game.homeTeam.name}-vs-${
      game.awayTeam.name
    }-${new Date(game.date).toISOString().split('T')[0]}.csv`;
    ExportService.downloadTextFile(csv, filename);
  }

  exportSeasonReport(): string {
    const seasonStats = this.getSeasonStatsArray();
    return ExportService.generateSeasonReport(seasonStats);
  }

  downloadSeasonReport(): void {
    const seasonStats = this.getSeasonStatsArray();
    const report = ExportService.generateSeasonReport(seasonStats);
    const filename = `season-report-${
      new Date().toISOString().split('T')[0]
    }.txt`;
    ExportService.downloadTextFile(report, filename);
  }

  downloadSeasonCSV(): void {
    const seasonStats = this.getSeasonStatsArray();
    const csv = ExportService.generateSeasonCSV(seasonStats);
    const filename = `season-data-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    ExportService.downloadTextFile(csv, filename);
  }
}

export const gameHistoryService = new GameHistoryService();
