/**
 * Data mapping utilities to convert service/API data to UI-friendly formats
 * This decouples the UI layer from service implementation details
 */

import { UITeam, UICreateTeamInput } from '../types/ui.types';
import {
  Team as ServiceTeam,
  CreateTeamInput as ServiceCreateTeamInput,
} from '../../services/teams-graphql.service';

/**
 * Maps a service Team object to a UI-friendly UITeam object
 */
export const mapServiceTeamToUITeam = (serviceTeam: ServiceTeam): UITeam => {
  // Parse colors from service format (comma-separated) to separate fields
  const colors = serviceTeam.colors
    ? serviceTeam.colors.split(',').map((c) => c.trim())
    : [];
  const primaryColor = colors[0] || '#3b82f6'; // Default blue
  const secondaryColor = colors[1] || colors[0] || '#1e40af'; // Default darker blue

  return {
    id: serviceTeam.id,
    name: serviceTeam.name,
    primaryColor,
    secondaryColor,
    logo: serviceTeam.logo,
    createdAt: serviceTeam.createdAt,
    // Player count would come from a separate field if available
    playerCount: 0, // This would be populated from team.players?.length if available
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
  const colors = [uiTeam.primaryColor, uiTeam.secondaryColor]
    .filter(Boolean)
    .join(', ');

  return {
    id: uiTeam.id,
    name: uiTeam.name,
    colors: colors || undefined,
    logo: uiTeam.logo,
  };
};

/**
 * Maps UI create team input to service format
 */
export const mapUICreateTeamToService = (
  uiInput: UICreateTeamInput
): ServiceCreateTeamInput => {
  const colors = [uiInput.primaryColor, uiInput.secondaryColor]
    .filter(Boolean)
    .join(', ');

  return {
    name: uiInput.name,
    colors: colors || undefined,
    logo: uiInput.logo,
  };
};

/**
 * Creates default color values for new teams
 */
export const getDefaultTeamColors = (): {
  primaryColor: string;
  secondaryColor: string;
} => {
  const colorSets = [
    { primaryColor: '#3b82f6', secondaryColor: '#1e40af' }, // Blue
    { primaryColor: '#ef4444', secondaryColor: '#dc2626' }, // Red
    { primaryColor: '#10b981', secondaryColor: '#059669' }, // Green
    { primaryColor: '#f59e0b', secondaryColor: '#d97706' }, // Orange
    { primaryColor: '#8b5cf6', secondaryColor: '#7c3aed' }, // Purple
    { primaryColor: '#06b6d4', secondaryColor: '#0891b2' }, // Cyan
  ];

  const randomIndex = Math.floor(Math.random() * colorSets.length);
  return colorSets[randomIndex];
};
