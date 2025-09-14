import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';

import {
  GET_TEAM_BY_ID,
  CREATE_TEAM,
  UPDATE_TEAM,
  TeamResponse,
  CreateTeamResponse,
  UpdateTeamResponse,
  GET_TEAMS,
} from '../../services/teams-graphql.service';
import { TeamManagementPresentation } from '../presentation/team-management.presentation';
import { TeamManagementTab } from '../presentation/team-management-tabs.presentation';
import { UICreateTeamInput, UIPosition } from '../types/ui.types';
import {
  mapUICreateTeamToService,
  mapServiceTeamToUITeam,
} from '../utils/data-mapping.utils';

import { useTeamConfigurationManager } from './team-configuration-manager.smart';

interface TeamManagementSmartProps {
  teamId?: string;
  isInSettingsMode?: boolean;
}

/**
 * Smart component for unified team management with tabs
 */
export const TeamManagementSmart = ({
  teamId,
  isInSettingsMode = false,
}: TeamManagementSmartProps) => {
  const navigate = useNavigate();
  const isEditing = Boolean(teamId);
  const [activeTab, setActiveTab] = useState<TeamManagementTab>('basic');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Redirect from players tab when in settings mode
  useEffect(() => {
    if (isInSettingsMode && activeTab === 'players') {
      setActiveTab('basic');
    }
  }, [isInSettingsMode, activeTab]);

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

  // Fetch existing team data if editing
  const {
    data: teamData,
    loading: fetchLoading,
    error: fetchError,
  } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    skip: !teamId,
  });

  // Create team mutation
  const [createTeam, { loading: createLoading, error: createError }] =
    useMutation<CreateTeamResponse>(CREATE_TEAM, {
      refetchQueries: [{ query: GET_TEAMS }],
      onCompleted: (data) => {
        // After creating, switch to format tab and update URL
        setActiveTab('format');
        navigate(`/teams/${data.createTeam.id}/manage`, { replace: true });
      },
    });

  // Update team mutation
  const [updateTeam, { loading: updateLoading, error: updateError }] =
    useMutation<UpdateTeamResponse>(UPDATE_TEAM, {
      refetchQueries: [{ query: GET_TEAMS }],
    });

  const handleCreateOrUpdateTeam = useCallback(
    async (uiTeamData: UICreateTeamInput) => {
      try {
        const serviceTeamData = mapUICreateTeamToService(uiTeamData);

        if (isEditing && teamId) {
          // Update existing team
          await updateTeam({
            variables: {
              id: teamId,
              updateTeamInput: serviceTeamData,
            },
          });
          // Stay on current tab for editing
        } else {
          // Create new team - advance to next step
          await createTeam({
            variables: {
              createTeamInput: serviceTeamData,
            },
          });
        }
      } catch (err) {
        console.error('Error saving team:', err);
      }
    },
    [createTeam, updateTeam, isEditing, teamId]
  );

  const handleCancel = useCallback(() => {
    if (isInSettingsMode && teamId) {
      navigate(`/teams/${teamId}/overview`);
    } else {
      navigate('/teams');
    }
  }, [navigate, isInSettingsMode, teamId]);

  const handleTabChange = useCallback(
    (tab: TeamManagementTab) => {
      // Prevent switching to players tab in settings mode
      if (isInSettingsMode && tab === 'players') {
        return;
      }
      setActiveTab(tab);
    },
    [isInSettingsMode]
  );

  const handleSaveSettings = useCallback(async () => {
    if (!teamId || !isEditing) return;

    try {
      // Get current team data for basic info
      const currentTeam = teamData?.team;
      if (!currentTeam) return;

      // Now we can save all team configuration data to the backend
      const updateData = {
        name: currentTeam.name,
        homePrimaryColor: currentTeam.homePrimaryColor,
        homeSecondaryColor: currentTeam.homeSecondaryColor,
        logoUrl: currentTeam.logoUrl,
        gameFormat: selectedGameFormat,
        formation: selectedFormation,
        customPositions: positions.map((pos: UIPosition) => ({
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

      console.log('Team configuration saved to backend:', {
        gameFormat: selectedGameFormat,
        formation: selectedFormation,
        customPositions: positions,
      });
    } catch (err) {
      console.error('Error saving team settings:', err);
    }
  }, [
    teamId,
    isEditing,
    teamData,
    updateTeam,
    selectedGameFormat,
    selectedFormation,
    positions,
  ]);

  const handleAddPosition = useCallback(() => {
    // Create a default position - this should be replaced with a proper modal/form
    const newPosition: UIPosition = {
      id: `pos-${Date.now()}`,
      name: 'New Position',
      abbreviation: 'NP',
      x: 50,
      y: 50,
    };
    addPosition(newPosition);
  }, [addPosition]);

  const handleComplete = useCallback(() => {
    if (isInSettingsMode && teamId) {
      navigate(`/teams/${teamId}/overview`);
    } else {
      navigate('/teams');
    }
  }, [navigate, isInSettingsMode, teamId]);

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
  if (isEditing && (fetchError || !teamData?.team)) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            {fetchError?.message || 'Team not found'}
          </p>
          <button
            onClick={handleCancel}
            className="mt-3 text-red-600 hover:text-red-800 underline"
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  // Convert service team to UI format for editing
  const uiTeam =
    isEditing && teamData?.team
      ? mapServiceTeamToUITeam(teamData.team)
      : undefined;

  return (
    <TeamManagementPresentation
      team={uiTeam}
      isEditing={isEditing}
      activeTab={activeTab}
      selectedGameFormat={selectedGameFormat}
      selectedFormation={selectedFormation}
      gameFormats={gameFormats}
      formations={formations}
      positions={positions}
      onTabChange={handleTabChange}
      onSaveBasicInfo={handleCreateOrUpdateTeam}
      onGameFormatSelect={selectGameFormat}
      onFormationSelect={selectFormation}
      onPositionUpdate={updatePosition}
      onAddPosition={handleAddPosition}
      onRemovePosition={removePosition}
      onCancel={handleCancel}
      onComplete={handleComplete}
      onSaveSettings={isInSettingsMode ? handleSaveSettings : undefined}
      loading={createLoading || updateLoading}
      error={createError?.message || updateError?.message}
      saveSuccess={saveSuccess}
      isInSettingsMode={isInSettingsMode}
    />
  );
};
