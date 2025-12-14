import { useState, useCallback } from 'react';
import { Link } from 'react-router';

import {
  UICreateTeamInput,
  UITeam,
  UIGameFormat,
  UIFormation,
} from '../types/ui.types';

interface TeamSettingsPresentationProps {
  team?: UITeam;
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
  onSaveSettings: (settingsData: {
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
  }) => void;
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
  loading: boolean;
  error?: string;
  saveSuccess?: boolean;
}

export const TeamSettingsPresentation = ({
  team,
  selectedGameFormat,
  selectedFormation,
  gameFormats,
  formations,
  positions,
  onSaveSettings,
  onGameFormatSelect,
  onFormationSelect,
  onPositionUpdate,
  onAddPosition,
  onRemovePosition,
  loading,
  error,
  saveSuccess = false,
}: TeamSettingsPresentationProps) => {
  const [teamName, setTeamName] = useState(team?.name || '');
  const [teamColors, setTeamColors] = useState(team?.colors || '');
  const [teamLogo, setTeamLogo] = useState(team?.logo || '');

  const handleSaveAll = useCallback(() => {
    const basicInfo: UICreateTeamInput = {
      name: teamName,
      colors: teamColors,
      logo: teamLogo,
    };

    const settingsData = {
      basicInfo,
      gameFormat: selectedGameFormat,
      formation: selectedFormation,
      positions,
    };

    onSaveSettings(settingsData);
  }, [
    teamName,
    teamColors,
    teamLogo,
    selectedGameFormat,
    selectedFormation,
    positions,
    onSaveSettings,
  ]);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Team Settings
            </h2>
            <p className="text-gray-600 mt-1">
              Configure your team's basic information, formation, and roster
            </p>
          </div>
          <Link
            to="/teams"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Teams
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Basic Team Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="teamName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Name *
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter team name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="teamColors"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Colors
              </label>
              <input
                type="text"
                id="teamColors"
                value={teamColors}
                onChange={(e) => setTeamColors(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Blue and White"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="teamLogo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Team Logo URL
              </label>
              <input
                type="url"
                id="teamLogo"
                value={teamLogo}
                onChange={(e) => setTeamLogo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Game Format Selection */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Game Format
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => onGameFormatSelect(format.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
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
                <div className="text-sm text-gray-600 mt-1">
                  {format.playersPerSide} players
                </div>
                {format.description && (
                  <div className="text-xs text-gray-500 mt-2">
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
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Formation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formations.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => onFormationSelect(formation.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
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
                  <div className="text-sm text-gray-600 mt-1">
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
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Position Configuration
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position List */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Positions</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                          <input
                            type="text"
                            value={position.name}
                            onChange={(e) =>
                              onPositionUpdate(position.id, {
                                name: e.target.value,
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
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
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Abbr"
                            maxLength={3}
                          />
                          <div className="text-xs text-gray-500 flex items-center">
                            ({position.x.toFixed(0)}, {position.y.toFixed(0)})
                          </div>
                        </div>
                        <button
                          onClick={() => onRemovePosition(position.id)}
                          className="ml-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={onAddPosition}
                    className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    + Add Position
                  </button>
                </div>

                {/* Visual Field Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Field Preview</h4>
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg aspect-[3/2] relative overflow-hidden">
                    {/* Field markings */}
                    <div className="absolute inset-2 border-2 border-white rounded">
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-white border-l-0"></div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-16 border-2 border-white border-r-0"></div>
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white"></div>
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Position markers */}
                    {positions.map((position) => (
                      <div
                        key={position.id}
                        className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold cursor-move transform -translate-x-1/2 -translate-y-1/2"
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
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
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

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={handleSaveAll}
            disabled={loading || !teamName.trim()}
            className={`
              px-6 py-3 rounded-md font-medium transition-all duration-200 min-w-[200px]
              ${
                loading || !teamName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
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
