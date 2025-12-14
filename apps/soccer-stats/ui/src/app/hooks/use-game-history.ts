import { useState, useEffect, useCallback } from 'react';

import {
  gameHistoryService,
  GameResult,
  SeasonStats,
  PlayerGameStats,
  GoalRecord,
  SubstitutionRecord,
} from '../services/game-history.service';
import { Team, Player, Goal } from '../types';

export const useGameHistory = () => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const history = gameHistoryService.getGameHistory();
      const season = gameHistoryService.getSeasonStatsArray();
      setGameHistory(history);
      setSeasonStats(season);
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveCurrentGame = useCallback(
    (
      homeTeam: Team,
      awayTeam: Team,
      homeTeamName: string,
      awayTeamName: string,
      gameTime: number,
      goals: Goal[],
      // Note: substitutions would need to be tracked in the main game state
      substitutions: SubstitutionRecord[] = []
    ) => {
      const gameId = `game-${Date.now()}`;

      // Convert team data to game stats format
      const convertToPlayerStats = (
        players: Player[],
        teamGoals: Goal[]
      ): PlayerGameStats[] => {
        return players.map((player) => ({
          id: player.id,
          name: player.name,
          jersey: player.jersey,
          position: player.position,
          playTime: player.playTime,
          goals: teamGoals.filter((goal) => goal.scorerId === player.id).length,
          assists: teamGoals.filter((goal) => goal.assistId === player.id)
            .length,
          photo: player.photo,
        }));
      };

      // Separate goals by team using Sets for better performance
      const homePlayerIds = new Set(homeTeam.players.map((p) => p.id));
      const awayPlayerIds = new Set(awayTeam.players.map((p) => p.id));

      const homeGoals = goals.filter((goal) =>
        homePlayerIds.has(goal.scorerId)
      );
      const awayGoals = goals.filter((goal) =>
        awayPlayerIds.has(goal.scorerId)
      );

      // Convert goals to records
      const goalRecords: GoalRecord[] = goals.map((goal) => {
        const isHomeGoal = homeTeam.players.some((p) => p.id === goal.scorerId);
        const scorer = [...homeTeam.players, ...awayTeam.players].find(
          (p) => p.id === goal.scorerId
        );
        const assist = goal.assistId
          ? [...homeTeam.players, ...awayTeam.players].find(
              (p) => p.id === goal.assistId
            )
          : undefined;

        return {
          id: goal.id,
          timestamp: goal.timestamp,
          team: isHomeGoal ? 'home' : 'away',
          scorerId: goal.scorerId,
          scorerName: scorer?.name || 'Unknown',
          assistId: goal.assistId,
          assistName: assist?.name,
          realTime: goal.realTime,
        };
      });

      const gameResult: GameResult = {
        id: gameId,
        date: new Date().toISOString(),
        homeTeam: {
          name: homeTeamName,
          score: homeGoals.length,
          players: convertToPlayerStats(homeTeam.players, homeGoals),
        },
        awayTeam: {
          name: awayTeamName,
          score: awayGoals.length,
          players: convertToPlayerStats(awayTeam.players, awayGoals),
        },
        duration: gameTime,
        goals: goalRecords,
        substitutions,
      };

      try {
        gameHistoryService.saveGame(gameResult);
        loadData(); // Refresh data
        return gameId;
      } catch (error) {
        console.error('Failed to save game:', error);
        throw error;
      }
    },
    [loadData]
  );

  const deleteGame = useCallback(
    (gameId: string) => {
      try {
        gameHistoryService.deleteGame(gameId);
        loadData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete game:', error);
        throw error;
      }
    },
    [loadData]
  );

  const clearAllData = useCallback(() => {
    try {
      gameHistoryService.clearGameHistory();
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }, [loadData]);

  const exportGameReport = useCallback((gameId: string): void => {
    gameHistoryService.downloadGameReport(gameId);
  }, []);

  const exportSeasonReport = useCallback((): void => {
    gameHistoryService.downloadSeasonReport();
  }, []);

  const getPlayerAnalytics = useCallback((playerId: number) => {
    return gameHistoryService.getPlayerAnalytics(playerId);
  }, []);

  const getTeamAnalytics = useCallback(() => {
    return gameHistoryService.getTeamAnalytics();
  }, []);

  return {
    // Data
    gameHistory,
    seasonStats,
    isLoading,

    // Actions
    saveCurrentGame,
    deleteGame,
    clearAllData,
    refreshData: loadData,

    // Reports
    exportGameReport,
    exportSeasonReport,

    // Analytics
    getPlayerAnalytics,
    getTeamAnalytics,
  };
};
