import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate } from 'react-router';

import {
  GET_TEAM_BY_ID,
  UPDATE_TEAM,
  TeamResponse,
  UpdateTeamResponse,
  GET_TEAMS,
} from '../../services/teams-graphql.service';
import { TeamSettingsPresentation } from '../presentation/team-settings.presentation';
import { UICreateTeamInput, UIPosition } from '../types/ui.types';
import {
  mapUICreateTeamToService,
  mapServiceTeamToUITeam,
} from '../utils/data-mapping.utils';

import { useTeamConfigurationManager } from './team-configuration-manager.smart';

export const TeamSettingsSmart = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Team configuration manager
  const {
    gameFormats,
    formations,
    availableFormations,
    selectedGameFormat,
    selectedFormation,
    positions,
    selectGameFormat,
    selectFormation,
    updatePosition,
    addPosition,
    removePosition,
    resetConfiguration,
  } = useTeamConfigurationManager();

  // Fetch existing team data
  const {
    data: teamData,
    loading: fetchLoading,
    error: fetchError,
  } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
  });

  // Update team mutation
  const [updateTeam, { loading: updateLoading, error: updateError }] =
    useMutation<UpdateTeamResponse>(UPDATE_TEAM, {
      refetchQueries: [{ query: GET_TEAMS }],
    });

  // Initialize configuration from team data when loaded
  useEffect(() => {
    if (teamData?.team) {
      const team = teamData.team;

      // Set game format if it exists
      if (team.gameFormat) {
        selectGameFormat(team.gameFormat);
      }

      // Set formation if it exists
      if (team.formation) {
        selectFormation(team.formation);
      }

      // Set custom positions if they exist
      if (team.customPositions && team.customPositions.length > 0) {
        // Set positions directly - need to update the configuration manager to support this
        // For now, we'll handle this in the save handler
      }
    }
  }, [teamData, selectGameFormat, selectFormation]);

  const handleSaveSettings = useCallback(
    async (settingsData: {
      basicInfo: UICreateTeamInput;
      gameFormat?: string;
      formation?: string;
      positions: Array<{
        id: string;
        name: string;
        abbreviation: string;
        x: number;
        y: number;
      }>;
    }) => {
      try {
        // Map UI data to service format
        const serviceTeamData = mapUICreateTeamToService(
          settingsData.basicInfo
        );

        // Add configuration data
        const updateData = {
          ...serviceTeamData,
          gameFormat: settingsData.gameFormat,
          formation: settingsData.formation,
          customPositions: settingsData.positions.map((pos) => ({
            id: pos.id,
            name: pos.name,
            abbreviation: pos.abbreviation,
            x: pos.x,
            y: pos.y,
          })),
        };

        await updateTeam({
          variables: {
            id: teamId,
            updateTeamInput: updateData,
          },
        });

        // Show success feedback
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        console.log('Team settings saved successfully:', updateData);
      } catch (err) {
        console.error('Error saving team settings:', err);
      }
    },
    [teamId, updateTeam]
  );

  // Show loading state for fetching
  if (fetchLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (fetchError || !teamData?.team) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            {fetchError?.message || 'Team not found'}
          </p>
        </div>
      </div>
    );
  }

  const team = mapServiceTeamToUITeam(teamData.team);

  // Wrapper functions to match presentation component expectations
  const handleAddPosition = () => {
    const newPosition: UIPosition = {
      id: `pos-${Date.now()}`,
      name: 'New Position',
      abbreviation: 'NP',
      x: 50,
      y: 50,
    };
    addPosition(newPosition);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <TeamSettingsPresentation
        team={team}
        selectedGameFormat={selectedGameFormat}
        selectedFormation={selectedFormation}
        gameFormats={gameFormats}
        formations={formations}
        positions={positions}
        onSaveSettings={handleSaveSettings}
        onGameFormatSelect={selectGameFormat}
        onFormationSelect={selectFormation}
        onPositionUpdate={updatePosition}
        onAddPosition={handleAddPosition}
        onRemovePosition={removePosition}
        loading={updateLoading}
        error={updateError?.message}
        saveSuccess={saveSuccess}
      />
    </div>
  );
};
