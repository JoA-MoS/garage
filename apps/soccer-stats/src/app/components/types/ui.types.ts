/**
 * UI-focused type definitions that are decoupled from service/API types
 * These types represent the data shape that UI components need to render properly
 */

export interface UITeam {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  playerCount?: number;
  createdAt?: string;
}

export interface UICreateTeamInput {
  name: string;
  primaryColor: string;
  secondaryColor: string;
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

export interface UIFormation {
  id: string;
  name: string;
  positions: Array<{
    x: number;
    y: number;
    position: string;
  }>;
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
