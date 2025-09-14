/**
 * Data mapping utilities to convert service/API data to UI-friendly formats
 * This decouples the UI layer from service implementation details
 */

import {
  UITeam,
  UICreateTeamInput,
  UIPlayer,
  UICreatePlayerInput,
} from '../types/ui.types';
import {
  Team as ServiceTeam,
  CreateTeamInput as ServiceCreateTeamInput,
} from '../../services/teams-graphql.service';
import {
  Player as ServicePlayer,
  CreatePlayerInput as ServiceCreatePlayerInput,
} from '../../services/players-graphql.service';

/**
 * Maps a service Team object to a UI-friendly UITeam object
 */
export const mapServiceTeamToUITeam = (serviceTeam: ServiceTeam): UITeam => {
  return {
    id: serviceTeam.id,
    name: serviceTeam.name,
    shortName: serviceTeam.shortName,
    description: serviceTeam.description,
    homePrimaryColor: serviceTeam.homePrimaryColor,
    homeSecondaryColor: serviceTeam.homeSecondaryColor,
    awayPrimaryColor: serviceTeam.awayPrimaryColor,
    awaySecondaryColor: serviceTeam.awaySecondaryColor,
    logoUrl: serviceTeam.logoUrl,
    isActive: serviceTeam.isActive,
    isManaged: serviceTeam.isManaged,
    sourceType: serviceTeam.sourceType,
    createdAt: serviceTeam.createdAt,
    updatedAt: serviceTeam.updatedAt,
    // Legacy support - map new fields to old field names for backward compatibility
    primaryColor: serviceTeam.homePrimaryColor || '#3b82f6',
    secondaryColor:
      serviceTeam.homeSecondaryColor ||
      serviceTeam.homePrimaryColor ||
      '#1e40af',
    logo: serviceTeam.logoUrl,
    // Player count would come from players array if available
    playerCount: serviceTeam.players?.length || 0,
  };
};

/**
 * Maps an array of service teams to UI teams
 */
export const mapServiceTeamsToUITeams = (
  serviceTeams: ServiceTeam[]
): UITeam[] => {
  return serviceTeams.map(mapServiceTeamToUITeam);
};

/**
 * Converts UI team data back to service format for API calls
 */
export const mapUITeamToServiceTeam = (
  uiTeam: Partial<UITeam>
): Partial<ServiceTeam> => {
  return {
    id: uiTeam.id,
    name: uiTeam.name,
    shortName: uiTeam.shortName,
    description: uiTeam.description,
    homePrimaryColor: uiTeam.homePrimaryColor || uiTeam.primaryColor,
    homeSecondaryColor: uiTeam.homeSecondaryColor || uiTeam.secondaryColor,
    awayPrimaryColor: uiTeam.awayPrimaryColor,
    awaySecondaryColor: uiTeam.awaySecondaryColor,
    logoUrl: uiTeam.logoUrl || uiTeam.logo,
  };
};

/**
 * Maps UI create team input to service format
 * Simple mapping for the essential team creation fields
 */
export const mapUICreateTeamToService = (
  uiInput: UICreateTeamInput
): ServiceCreateTeamInput => {
  return {
    name: uiInput.name,
    colors: uiInput.colors,
    logo: uiInput.logo,
  };
};

/**
 * Creates default color values for new teams
 */
export const getDefaultTeamColors = (): string => {
  const colorSets = [
    '#3b82f6,#1e40af', // Blue
    '#ef4444,#dc2626', // Red
    '#10b981,#059669', // Green
    '#f59e0b,#d97706', // Orange
    '#8b5cf6,#7c3aed', // Purple
    '#06b6d4,#0891b2', // Cyan
  ];

  const randomIndex = Math.floor(Math.random() * colorSets.length);
  return colorSets[randomIndex];
};

/**
 * Maps a service Player (User) object to a UI-friendly UIPlayer object
 */
export const mapServicePlayerToUIPlayer = (
  servicePlayer: ServicePlayer
): UIPlayer => {
  return {
    id: servicePlayer.id,
    firstName: servicePlayer.firstName,
    lastName: servicePlayer.lastName,
    email: servicePlayer.email,
    dateOfBirth: servicePlayer.dateOfBirth,
    phone: servicePlayer.phone,
    isActive: servicePlayer.isActive,
    // Legacy support - combine firstName and lastName
    name: `${servicePlayer.firstName} ${servicePlayer.lastName}`,
  };
};

/**
 * Maps an array of service players to UI players
 */
export const mapServicePlayersToUIPlayers = (
  servicePlayers: ServicePlayer[]
): UIPlayer[] => {
  return servicePlayers.map(mapServicePlayerToUIPlayer);
};

/**
 * Maps UI create player input to service format
 * Handles both new field names and legacy field names
 */
export const mapUICreatePlayerToService = (
  uiInput: UICreatePlayerInput
): ServiceCreatePlayerInput => {
  // Handle legacy name field by parsing it if present
  let firstName = uiInput.firstName;
  let lastName = uiInput.lastName;

  if (uiInput.name && (!firstName || !lastName)) {
    const nameParts = uiInput.name.trim().split(' ');
    firstName = nameParts[0] || firstName;
    lastName = nameParts.slice(1).join(' ') || lastName;
  }

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    email: uiInput.email,
    passwordHash: uiInput.passwordHash || 'default-password', // TODO: Implement proper password handling
    dateOfBirth: uiInput.dateOfBirth,
    phone: uiInput.phone,
  };
};

/**
 * Maps UI player data back to service format for updates
 */
export const mapUIPlayerToServicePlayer = (
  uiPlayer: Partial<UIPlayer>
): Partial<ServicePlayer> => {
  return {
    id: uiPlayer.id,
    firstName: uiPlayer.firstName,
    lastName: uiPlayer.lastName,
    email: uiPlayer.email,
    dateOfBirth: uiPlayer.dateOfBirth,
    phone: uiPlayer.phone,
    isActive: uiPlayer.isActive,
  };
};
