export interface Player {
  id: number;
  name: string;
  jersey: number;
  position: string;
  depthRank: number;
  playTime: number;
  isOnField: boolean;
  goals: number;
  assists: number;
  team: 'home' | 'away';
}

export interface Team {
  name: string;
  players: Player[];
  score: number;
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
