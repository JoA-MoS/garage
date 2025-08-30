import { Team, Goal } from '../types';

/**
 * Game Statistics Service
 *
 * Provides basic statistics calculations for the current game data model.
 * This is a simplified version that works with the existing Team/Player/Goal structure.
 */
export class GameStatsService {
  /**
   * Calculate total goals scored by a team
   */
  static getTeamScore(team: Team): number {
    return team.goals.length;
  }

  /**
   * Calculate goals scored by a specific player
   */
  static getPlayerGoals(playerId: number, team: Team): number {
    return team.goals.filter((goal) => goal.scorerId === playerId).length;
  }

  /**
   * Calculate assists by a specific player
   */
  static getPlayerAssists(playerId: number, team: Team): number {
    return team.goals.filter((goal) => goal.assistId === playerId).length;
  }

  /**
   * Get all goal records for a specific player
   */
  static getPlayerGoalRecords(playerId: number, team: Team): Goal[] {
    return team.goals.filter((goal) => goal.scorerId === playerId);
  }

  /**
   * Get all assist records for a specific player
   */
  static getPlayerAssistRecords(playerId: number, team: Team): Goal[] {
    return team.goals.filter((goal) => goal.assistId === playerId);
  }

  /**
   * Get team statistics summary
   */
  static getTeamStats(team: Team) {
    const totalGoals = this.getTeamScore(team);
    const playerStats = team.players.map((player) => ({
      ...player,
      goals: this.getPlayerGoals(player.id, team),
      assists: this.getPlayerAssists(player.id, team),
    }));

    return {
      totalGoals,
      totalPlayers: team.players.length,
      playersOnField: team.players.filter((p) => p.isOnField).length,
      topScorer: playerStats.reduce(
        (top, player) => (player.goals > top.goals ? player : top),
        { goals: 0, name: 'None' }
      ),
      playerStats,
    };
  }

  /**
   * Generate unique goal ID (will be replaced by DB auto-increment)
   */
  static generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new goal record
   */
  static createGoal(
    scorerId: number,
    assistId: number | undefined,
    gameTime: number
  ): Goal {
    return {
      id: this.generateGoalId(),
      timestamp: gameTime,
      scorerId,
      assistId,
      realTime: new Date().toISOString(),
    };
  }
}
