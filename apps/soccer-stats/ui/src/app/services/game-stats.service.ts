import { Team, Goal, StatEvent, StatEventType } from '../types';

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

  /**
   * Create a new opponent goal record using jersey numbers
   */
  static createOpponentGoal(
    scorerJersey: number,
    assistJersey: number | undefined,
    gameTime: number
  ): Goal {
    return {
      id: this.generateGoalId(),
      timestamp: gameTime,
      scorerId: -1, // Use -1 to indicate opponent goal
      assistId: assistJersey ? -1 : undefined, // Use -1 for opponent assist or undefined
      isOpponentGoal: true,
      opponentScorerJersey: scorerJersey,
      opponentAssistJersey: assistJersey,
      realTime: new Date().toISOString(),
    };
  }

  // PHASE 1: Additional Statistics Methods

  /**
   * Generate unique stat event ID
   */
  static generateStatEventId(): string {
    return `stat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create a new stat event record
   */
  static createStatEvent(
    playerId: number,
    eventType: StatEventType,
    gameTime: number,
    metadata?: Record<string, unknown>
  ): StatEvent {
    return {
      id: this.generateStatEventId(),
      timestamp: gameTime,
      playerId,
      eventType,
      realTime: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Get stat events by type for a specific player
   */
  static getPlayerStatEvents(
    playerId: number,
    team: Team,
    eventType?: StatEventType
  ): StatEvent[] {
    const playerEvents = team.statEvents.filter(
      (event) => event.playerId === playerId
    );
    return eventType
      ? playerEvents.filter((event) => event.eventType === eventType)
      : playerEvents;
  }

  /**
   * Get stat count by type for a specific player
   */
  static getPlayerStatCount(
    playerId: number,
    team: Team,
    eventType: StatEventType
  ): number {
    return this.getPlayerStatEvents(playerId, team, eventType).length;
  }

  /**
   * Get yellow cards for a player
   */
  static getPlayerYellowCards(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'yellow_card');
  }

  /**
   * Get red cards for a player
   */
  static getPlayerRedCards(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'red_card');
  }

  /**
   * Get fouls committed by a player
   */
  static getPlayerFoulsCommitted(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'foul_committed');
  }

  /**
   * Get fouls received by a player
   */
  static getPlayerFoulsReceived(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'foul_received');
  }

  /**
   * Get shots on target by a player (includes goals)
   */
  static getPlayerShotsOnTarget(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'shot_on_target');
  }

  /**
   * Get shots off target by a player
   */
  static getPlayerShotsOffTarget(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'shot_off_target');
  }

  /**
   * Get total shots by a player (shots on target + shots off target)
   * Note: Goals are automatically included in shots on target
   */
  static getPlayerTotalShots(playerId: number, team: Team): number {
    return (
      this.getPlayerShotsOnTarget(playerId, team) +
      this.getPlayerShotsOffTarget(playerId, team)
    );
  }

  /**
   * Get saves by a player (goalkeeper)
   */
  static getPlayerSaves(playerId: number, team: Team): number {
    return this.getPlayerStatCount(playerId, team, 'save');
  }

  /**
   * Get shooting accuracy for a player
   */
  static getPlayerShootingAccuracy(playerId: number, team: Team): number {
    const totalShots = this.getPlayerTotalShots(playerId, team);
    const shotsOnTarget = this.getPlayerShotsOnTarget(playerId, team);
    return totalShots > 0 ? Math.round((shotsOnTarget / totalShots) * 100) : 0;
  }
}
