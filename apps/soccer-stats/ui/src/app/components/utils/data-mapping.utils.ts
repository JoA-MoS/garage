/**
 * Temporary minimal data mapping utilities
 * TODO: Replace with three-layer fragment architecture
 */

// Temporary placeholder function
export const mapServiceTeamToUITeam = (serviceTeam: any): any => {
  // Simple pass-through for now
  return {
    ...serviceTeam,
    primaryColor: serviceTeam.homePrimaryColor,
    secondaryColor: serviceTeam.homeSecondaryColor,
    logo: serviceTeam.logoUrl,
    playerCount: 0,
  };
};

export const mapServiceTeamsToUITeams = (serviceTeams: any[]): any[] => {
  return serviceTeams.map(mapServiceTeamToUITeam);
};

export const mapUICreateTeamToService = (uiInput: any): any => {
  return {
    name: uiInput.name,
    // TODO: Implement proper mapping
  };
};

export const getDefaultTeamColors = (): string => {
  return '#3b82f6,#1e40af'; // Blue
};
