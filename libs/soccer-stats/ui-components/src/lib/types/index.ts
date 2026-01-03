/**
 * UI-focused type definitions for presentation components
 * These types are decoupled from service/API types
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
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  colors?: string;
}

export interface UIPlayer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  isActive: boolean;
  name?: string;
  position?: string;
  jerseyNumber?: string;
}

export interface UICreatePlayerInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  dateOfBirth?: string;
  phone?: string;
  /** Legacy support for forms */
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
  displayName?: string;
  playersPerSide?: number;
  defaultDuration?: number;
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
  gameFormat?: string;
  playersPerSide?: number;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  foulsCommitted: number;
  foulsReceived: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  saves: number;
}

export interface UICreateTeamInput {
  name: string;
  homePrimaryColor?: string;
  homeSecondaryColor?: string;
  awayPrimaryColor?: string;
  awaySecondaryColor?: string;
  logoUrl?: string;
  // Legacy support
  colors?: string;
  logo?: string;
}

export interface UIEditTeamInput extends UICreateTeamInput {
  id: string;
}
