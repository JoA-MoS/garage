export interface Player {
  id: number;
  name: string;
  jersey: number;
  position: string;
  depthRank: number;
  playTime: number;
  isOnField: boolean;
  photo?: string; // Optional URL to player photo
}

// Simple opponent player for basic tracking
export interface OpponentPlayer {
  jersey: number;
  name?: string; // Optional - often unknown
}

export interface Goal {
  id: string;
  timestamp: number; // Game time in seconds when goal was scored
  scorerId: number; // Player who scored
  assistId?: number; // Player who assisted (optional)
  realTime: string; // Actual timestamp when goal was recorded
  // For opponent goals, we store minimal info
  isOpponentGoal?: boolean;
  opponentScorerJersey?: number;
  opponentAssistJersey?: number;
}

// Phase 1: Additional stat events
export interface StatEvent {
  id: string;
  timestamp: number; // Game time in seconds when event occurred
  playerId: number; // Player involved
  eventType: StatEventType;
  realTime: string; // Actual timestamp when recorded
  metadata?: Record<string, unknown>; // Additional event-specific data
}

export type StatEventType =
  | 'yellow_card'
  | 'red_card'
  | 'foul_committed'
  | 'foul_received'
  | 'shot_on_target'
  | 'shot_off_target'
  | 'save';

export interface Team {
  name: string;
  players: Player[];
  goals: Goal[];
  statEvents: StatEvent[]; // Phase 1: Track additional stats
  isDetailedTracking: boolean; // New: whether to track detailed stats
}

export interface GameConfig {
  playersPerTeam: number;
  playersOnField: number;
  positions: string[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamDetailedTracking: boolean; // New: detailed tracking for home team
  awayTeamDetailedTracking: boolean; // New: detailed tracking for away team
}

export interface SubstitutionRecommendation {
  playerOut: Player;
  playerIn: Player;
  reason: string;
}
