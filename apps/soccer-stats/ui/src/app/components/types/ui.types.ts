/**
 * UI-focused type definitions that are decoupled from service/API types
 * These types represent the data shape that UI components need to render properly
 */

export interface UITeam {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  colors?: string; // Raw colors string from service
  logo?: string;
  playerCount?: number;
  createdAt?: string;
}

export interface UICreateTeamInput {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  colors?: string; // Allow raw colors for simplified forms
  logo?: string;
}

export interface UIEditTeamInput extends UICreateTeamInput {
  id: string;
}

export interface UIPlayer {
  id: string;
  name: string;
  position: string;
  jerseyNumber?: number;
}

export interface UITeamWithPlayers extends UITeam {
  players: UIPlayer[];
}

export interface UIGameFormat {
  id: string;
  name: string;
  displayName: string;
  playersPerSide: number;
  description?: string;
}

export interface UIPosition {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
}

export interface UIFormation {
  id: string;
  name: string;
  description?: string;
  positions: UIPosition[];
  isActive: boolean;
  gameFormat?: string; // For filtering formations by game format
  playersPerSide?: number; // Number of players for this formation
}

export interface UITeamConfiguration {
  gameFormat?: string;
  formation?: string;
  customPositions?: UIPosition[];
}

export interface UIGameSummary {
  id: string;
  opponent: string;
  date: string;
  isHome: boolean;
  status: 'upcoming' | 'completed' | 'live';
  score?: {
    home: number;
    away: number;
  };
}
