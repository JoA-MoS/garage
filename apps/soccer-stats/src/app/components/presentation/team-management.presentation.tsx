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
  loading: boolean;
  error?: string;
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
  loading,
  error,
}: TeamManagementPresentationProps) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="p-6">
            <CreateTeamPresentation
              onSubmit={onSaveBasicInfo}
              onCancel={onCancel}
              loading={loading}
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
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

        {/* Tabs */}
        <TeamManagementTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          team={team}
          isEditing={isEditing}
        />

        {/* Tab Content */}
        <div className="min-h-96">{renderTabContent()}</div>
      </div>
    </div>
  );
};
