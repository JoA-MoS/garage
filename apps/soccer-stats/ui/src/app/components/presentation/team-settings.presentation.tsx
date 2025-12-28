import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router';

import {
  UICreateTeamInput,
  UITeam,
  UIGameFormat,
  UIFormation,
} from '../types/ui.types';
import { StatsTrackingLevel } from '../../generated/graphql';

import {
  TeamFormFields,
  createTeamFormValues,
} from './team-form-fields.presentation';
import { StatsTrackingSelector } from './stats-tracking-selector.presentation';

interface TeamSettingsPresentationProps {
  team?: UITeam;
  selectedGameFormat?: string;
  selectedFormation?: string;
  statsTrackingLevel: StatsTrackingLevel;
  gameFormats: UIGameFormat[];
  formations: UIFormation[];
  positions: Array<{
    id: string;
    name: string;
    abbreviation: string;
    x: number;
    y: number;
  }>;
  onSaveSettings: (settingsData: {
    basicInfo: UICreateTeamInput;
    gameFormat?: string;
    formation?: string;
    statsTrackingLevel: StatsTrackingLevel;
    positions: Array<{
      id: string;
      name: string;
      abbreviation: string;
      x: number;
      y: number;
    }>;
  }) => void;
  onGameFormatSelect: (formatId: string) => void;
  onFormationSelect: (formationId: string) => void;
  onStatsTrackingLevelChange: (level: StatsTrackingLevel) => void;
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
  loading: boolean;
  error?: string;
  saveSuccess?: boolean;
}

export const TeamSettingsPresentation = ({
  team,
  selectedGameFormat,
  selectedFormation,
  statsTrackingLevel,
  gameFormats,
  formations,
  positions,
  onSaveSettings,
  onGameFormatSelect,
  onFormationSelect,
  onStatsTrackingLevelChange,
  onPositionUpdate,
  onAddPosition,
  onRemovePosition,
  loading,
  error,
  saveSuccess = false,
}: TeamSettingsPresentationProps) => {
  const [basicInfo, setBasicInfo] = useState<UICreateTeamInput>(
    team
      ? createTeamFormValues(team)
      : {
          name: '',
          homePrimaryColor: '#3b82f6',
          homeSecondaryColor: '#ffffff',
          awayPrimaryColor: '#ffffff',
          awaySecondaryColor: '#3b82f6',
          logoUrl: '',
        }
  );

  // Update form data when team changes
  useEffect(() => {
    if (team) {
      setBasicInfo(createTeamFormValues(team));
    }
  }, [team]);

  const handleSaveAll = useCallback(() => {
    const settingsData = {
      basicInfo,
      gameFormat: selectedGameFormat,
      formation: selectedFormation,
      statsTrackingLevel,
      positions,
    };

    onSaveSettings(settingsData);
  }, [
    basicInfo,
    selectedGameFormat,
    selectedFormation,
    statsTrackingLevel,
    positions,
    onSaveSettings,
  ]);

  return (
    <div className="rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Team Settings
            </h2>
            <p className="mt-1 text-gray-600">
              Configure your team's basic information, formation, and roster
            </p>
          </div>
          <Link
            to="/teams"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            ← Back to Teams
          </Link>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {/* Basic Team Information */}
        <div className="space-y-6">
          <h3 className="border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">
            Basic Information
          </h3>
          <TeamFormFields
            value={basicInfo}
            onChange={setBasicInfo}
            disabled={loading}
          />
        </div>

        {/* Stats Tracking Level */}
        <div className="space-y-6">
          <h3 className="border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">
            Stats Tracking
          </h3>
          <StatsTrackingSelector
            value={statsTrackingLevel}
            onChange={onStatsTrackingLevelChange}
            variant="grid"
            disabled={loading}
            description="Choose how detailed you want to track statistics during games. This setting will be the default for all new games."
          />
        </div>

        {/* Game Format Selection */}
        <div className="space-y-6">
          <h3 className="border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">
            Game Format
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gameFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => onGameFormatSelect(format.id)}
                className={`
                  rounded-lg border-2 p-4 text-left transition-all duration-200
                  ${
                    selectedGameFormat === format.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-medium text-gray-900">
                  {format.displayName}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {format.playersPerSide} players
                </div>
                {format.description && (
                  <div className="mt-2 text-xs text-gray-500">
                    {format.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Formation Selection */}
        {selectedGameFormat && (
          <div className="space-y-6">
            <h3 className="border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">
              Formation
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {formations.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => onFormationSelect(formation.id)}
                  className={`
                    rounded-lg border-2 p-4 text-left transition-all duration-200
                    ${
                      selectedFormation === formation.id
                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-medium text-gray-900">
                    {formation.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {formation.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Position Configuration */}
        {selectedFormation && positions.length > 0 && (
          <div className="space-y-6">
            <h3 className="border-b border-gray-200 pb-2 text-lg font-medium text-gray-900">
              Position Configuration
            </h3>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Position List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Positions</h4>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3"
                      >
                        <div className="grid flex-1 grid-cols-3 gap-2 text-sm">
                          <input
                            type="text"
                            value={position.name}
                            onChange={(e) =>
                              onPositionUpdate(position.id, {
                                name: e.target.value,
                              })
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Position name"
                          />
                          <input
                            type="text"
                            value={position.abbreviation}
                            onChange={(e) =>
                              onPositionUpdate(position.id, {
                                abbreviation: e.target.value,
                              })
                            }
                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Abbr"
                            maxLength={3}
                          />
                          <div className="flex items-center text-xs text-gray-500">
                            ({position.x.toFixed(0)}, {position.y.toFixed(0)})
                          </div>
                        </div>
                        <button
                          onClick={() => onRemovePosition(position.id)}
                          className="ml-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={onAddPosition}
                    className="w-full rounded-md border border-dashed border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-800"
                  >
                    + Add Position
                  </button>
                </div>

                {/* Visual Field Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Field Preview</h4>
                  <div className="relative aspect-[3/2] overflow-hidden rounded-lg border-2 border-green-300 bg-green-100">
                    {/* Field markings */}
                    <div className="absolute inset-2 rounded border-2 border-white">
                      <div className="absolute left-0 top-1/2 h-16 w-4 -translate-y-1/2 transform border-2 border-l-0 border-white"></div>
                      <div className="absolute right-0 top-1/2 h-16 w-4 -translate-y-1/2 transform border-2 border-r-0 border-white"></div>
                      <div className="absolute bottom-0 left-1/2 top-0 w-0.5 bg-white"></div>
                      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white"></div>
                    </div>

                    {/* Position markers */}
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform cursor-move items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                        }}
                        title={position.name}
                      >
                        {position.abbreviation}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <svg
                className="mr-2 h-5 w-5 text-green-500"
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
              <p className="text-sm font-medium text-green-800">
                Team settings saved successfully!
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end border-t border-gray-200 pt-6">
          <button
            onClick={handleSaveAll}
            disabled={loading || !basicInfo.name.trim()}
            className={`
              min-w-[200px] rounded-md px-6 py-3 font-medium transition-all duration-200
              ${
                loading || !basicInfo.name.trim()
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-current"
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
  );
};
