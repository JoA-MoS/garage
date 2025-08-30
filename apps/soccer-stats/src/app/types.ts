export interface Player {
  id: number;
  name: string;
  jersey: number;
  position: string;
  depthRank: number;
  playTime: number;
  isOnField: boolean;
}

export interface Goal {
  id: string;
  timestamp: number; // Game time in seconds when goal was scored
  scorerId: number; // Player who scored
  assistId?: number; // Player who assisted (optional)
  realTime: string; // Actual timestamp when goal was recorded
}

export interface Team {
  name: string;
  players: Player[];
  goals: Goal[];
}

export interface GameConfig {
  playersPerTeam: number;
  playersOnField: number;
  positions: string[];
  homeTeamName: string;
  awayTeamName: string;
}

export interface SubstitutionRecommendation {
  playerOut: Player;
  playerIn: Player;
  reason: string;
}
