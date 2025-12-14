/**
 * UI-focused type definitions that are decoupled from service/API types
 * These types represent the data shape that UI components need to render properly
 */

export interface UITeam {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
  isActive: boolean;
  isManaged: boolean;
  sourceType: 'INTERNAL' | 'EXTERNAL';
  playerCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Legacy support for backwards compatibility
  primaryColor?: string; // Maps to homePrimaryColor
  secondaryColor?: string; // Maps to homeSecondaryColor
  logo?: string; // Maps to logoUrl
  colors?: string; // Legacy field
}

export interface UICreateTeamInput {
  name: string;
  colors?: string;
  logo?: string;
}

export interface UIEditTeamInput extends UICreateTeamInput {
  id: string;
}

export interface UIPlayer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  isActive: boolean;
  // Legacy support
  name?: string; // Computed from firstName + lastName
  position?: string; // From team player relationship
  jerseyNumber?: string; // From team player relationship
}

export interface UICreatePlayerInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  dateOfBirth?: string;
  phone?: string;
  // Legacy support for forms that haven't been updated yet
  name?: string; // Maps to firstName + lastName
  position?: string; // For display purposes only
}

export interface UIUpdatePlayerInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash?: string;
  dateOfBirth?: string;
  phone?: string;
  // Legacy support
  name?: string;
  position?: string;
}

export interface UITeamPlayer {
  id: string;
  jerseyNumber?: string;
  primaryPosition?: string;
  isActive: boolean;
  joinedDate?: string;
  leftDate?: string;
  user: UIPlayer;
}

export interface UITeamWithPlayers extends UITeam {
  players: UIPlayer[];
  teamPlayers: UITeamPlayer[];
  playersWithJersey: UITeamPlayerWithJersey[];
}

export interface UITeamPlayerWithJersey {
  id: string;
  name: string;
  position?: string;
  jersey: number;
  depthRank: number;
  isActive: boolean;
}

export interface UIGameFormat {
  id: string;
  name: string;
  playersPerTeam: number;
  durationMinutes: number;
  description?: string;
  allowsSubstitutions: boolean;
  maxSubstitutions?: number;
  // Legacy support
  displayName?: string; // Maps to name
  playersPerSide?: number; // Maps to playersPerTeam
  defaultDuration?: number; // Maps to durationMinutes
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
