import { Link } from 'react-router';

import {
  UICreateTeamInput,
  UITeam,
  UIGameFormat,
  UIFormation,
} from '../types/ui.types';

import {
  TeamManagementTabs,
  TeamManagementTab,
} from './team-management-tabs.presentation';
import { CreateTeamPresentation } from './create-team.presentation';
import { GameFormatSelectionPresentation } from './game-format-selection.presentation';
import { FormationSelectionPresentation } from './formation-selection.presentation';
import { PositionConfigurationPresentation } from './position-configuration.presentation';

interface TeamManagementPresentationProps {
  team?: UITeam;
  isEditing: boolean;
  activeTab: TeamManagementTab;
  selectedGameFormat?: string;
  selectedFormation?: string;
  gameFormats: UIGameFormat[];
  formations: UIFormation[];
  positions: Array<{
    id: string;
    name: string;
    abbreviation: string;
    x: number;
    y: number;
  }>;
  onTabChange: (tab: TeamManagementTab) => void;
  onSaveBasicInfo: (teamData: UICreateTeamInput) => void;
  onGameFormatSelect: (formatId: string) => void;
  onFormationSelect: (formationId: string) => void;
  onPositionUpdate: (
    positionId: string,
    updates: Partial<{
      id: string;
      name: string;
      abbreviation: string;
      x: number;
      y: number;
    }>
  ) => void;
  onAddPosition: () => void;
  onRemovePosition: (positionId: string) => void;
  onCancel: () => void;
  onComplete: () => void;
  onSaveSettings?: () => void;
  loading: boolean;
  error?: string;
  saveSuccess?: boolean;
  isInSettingsMode?: boolean;
}

export const TeamManagementPresentation = ({
  team,
  isEditing,
  activeTab,
  selectedGameFormat,
  selectedFormation,
  gameFormats,
  formations,
  positions,
  onTabChange,
  onSaveBasicInfo,
  onGameFormatSelect,
  onFormationSelect,
  onPositionUpdate,
  onAddPosition,
  onRemovePosition,
  onCancel,
  onComplete,
  onSaveSettings,
  loading,
  error,
  saveSuccess = false,
  isInSettingsMode = false,
}: TeamManagementPresentationProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="p-6">
            <CreateTeamPresentation
              onSubmit={onSaveBasicInfo}
              onCancel={onCancel}
              loading={loading || false}
              error={error}
              initialData={team}
              isTabMode={true}
              onNext={() => onTabChange('format')}
            />
          </div>
        );

      case 'format':
        if (!team?.id && !isEditing) {
          return (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  Please complete the basic team information first.
                </p>
                <button
                  onClick={() => onTabChange('basic')}
                  className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
                >
                  Go to Basic Info
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6">
            <GameFormatSelectionPresentation
              gameFormats={gameFormats}
              selectedFormat={selectedGameFormat}
              onFormatSelect={onGameFormatSelect}
              onNext={() => onTabChange('formation')}
              onPrevious={() => onTabChange('basic')}
              isTabMode={true}
            />
          </div>
        );

      case 'formation':
        if (!selectedGameFormat) {
          return (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  Please select a game format first.
                </p>
                <button
                  onClick={() => onTabChange('format')}
                  className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
                >
                  Go to Game Format
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6">
            <FormationSelectionPresentation
              formations={formations}
              selectedFormation={selectedFormation}
              gameFormat={selectedGameFormat}
              onFormationSelect={onFormationSelect}
              onNext={() => onTabChange('positions')}
              onPrevious={() => onTabChange('format')}
              isTabMode={true}
            />
          </div>
        );

      case 'positions':
        if (!selectedFormation) {
          return (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  Please select a formation first.
                </p>
                <button
                  onClick={() => onTabChange('formation')}
                  className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
                >
                  Go to Formation
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6">
            <PositionConfigurationPresentation
              positions={positions}
              onPositionUpdate={onPositionUpdate}
              onAddPosition={onAddPosition}
              onRemovePosition={onRemovePosition}
              onNext={() => onTabChange('players')}
              onPrevious={() => onTabChange('formation')}
              isTabMode={true}
            />
          </div>
        );

      case 'players':
        // If in settings mode, redirect to the team players page
        if (isInSettingsMode && team?.id) {
          return (
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Player Management
                </h3>
                <p className="text-blue-800 mb-4">
                  Players are managed at the team level. Use the Players tab in
                  the main team navigation.
                </p>
                <Link
                  to={`/teams/${team.id}/players`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Players
                </Link>
              </div>
            </div>
          );
        }

        if (!positions.length) {
          return (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  Please configure your team positions first.
                </p>
                <button
                  onClick={() => onTabChange('positions')}
                  className="mt-2 text-yellow-600 hover:text-yellow-800 underline"
                >
                  Go to Positions
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Add Players
              </h3>
              <p className="text-green-800 mb-4">
                Add players to your team or select from existing players.
              </p>
              <p className="text-sm text-green-600">
                This section will allow you to create new players or select
                existing ones for your team.
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => onTabChange('positions')}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                >
                  ← Previous
                </button>
                <button
                  onClick={onComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={isInSettingsMode ? '' : 'max-w-6xl mx-auto p-6'}>
      <div className={isInSettingsMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - Only show when not in settings mode */}
        {!isInSettingsMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing
                    ? `Manage ${team?.name || 'Team'}`
                    : 'Create New Team'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing
                    ? 'Update your team settings and roster'
                    : 'Set up your team with formation and players'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/teams"
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to Teams
                </Link>
                {isEditing && (
                  <button
                    onClick={onComplete}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <TeamManagementTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          team={team}
          isEditing={isEditing}
          isInSettingsMode={isInSettingsMode}
        />

        {/* Tab Content */}
        <div className="min-h-96">{renderTabContent()}</div>

        {/* Settings Mode Save Button */}
        {isInSettingsMode && onSaveSettings && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            {/* Success Message */}
            {saveSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">
                    Team settings saved successfully!
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Save your changes to update the team configuration.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveSettings}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Team Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
