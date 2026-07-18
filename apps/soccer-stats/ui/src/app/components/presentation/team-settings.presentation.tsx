import { useState, useCallback, useEffect } from 'react';

import {
  createTeamFormValues,
  TeamFormFields,
  type UICreateTeamInput,
  type UIStatsFeatures,
} from '@garage/soccer-stats/ui-components';

import { CalendarSourceViewModel } from '../../services/calendar-sync-graphql.service';
import { UITeam, UIGameFormat, UIFormation } from '../types/ui.types';

import { StatsTrackingSelector } from './stats-tracking-selector.presentation';

interface TeamSettingsPresentationProps {
  team?: UITeam;
  selectedGameFormat?: string;
  selectedFormation?: string;
  statsFeatures: UIStatsFeatures;
  gameFormats: UIGameFormat[];
  formations: UIFormation[];
  positions: Array<{
    id: string;
    name: string;
    abbreviation: string;
    x: number;
    y: number;
  }>;
  calendarSources: CalendarSourceViewModel[];
  calendarSourcesLoading: boolean;
  calendarSourcesError?: string;
  creatingCalendarSource: boolean;
  syncingCalendarSource: boolean;
  calendarSuccessMessage?: string;
  calendarErrorMessage?: string;
  onCreateCalendarSource: (feedUrl: string) => void;
  onSyncCalendarSource: (sourceId: string) => void;
  onSaveSettings: (settingsData: {
    basicInfo: UICreateTeamInput;
    gameFormat?: string;
    formation?: string;
    statsFeatures: UIStatsFeatures;
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
  onStatsFeaturesChange: (features: UIStatsFeatures) => void;
  onPositionUpdate: (
    positionId: string,
    updates: Partial<{
      id: string;
      name: string;
      abbreviation: string;
      x: number;
      y: number;
    }>,
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
  statsFeatures,
  gameFormats,
  formations,
  positions,
  calendarSources,
  calendarSourcesLoading,
  calendarSourcesError,
  creatingCalendarSource,
  syncingCalendarSource,
  calendarSuccessMessage,
  calendarErrorMessage,
  onCreateCalendarSource,
  onSyncCalendarSource,
  onSaveSettings,
  onGameFormatSelect,
  onFormationSelect,
  onStatsFeaturesChange,
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
        },
  );
  const [calendarFeedUrl, setCalendarFeedUrl] = useState('');

  const normalizedCalendarFeedUrl = calendarFeedUrl.trim();
  const canCreateCalendarSource =
    normalizedCalendarFeedUrl.length > 0 && !creatingCalendarSource;
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
      statsFeatures,
      positions,
    };

    onSaveSettings(settingsData);
  }, [
    basicInfo,
    selectedGameFormat,
    selectedFormation,
    statsFeatures,
    positions,
    onSaveSettings,
  ]);

  const handleCreateCalendarSource = useCallback(() => {
    if (!canCreateCalendarSource) return;
    onCreateCalendarSource(normalizedCalendarFeedUrl);
    setCalendarFeedUrl('');
  }, [
    canCreateCalendarSource,
    normalizedCalendarFeedUrl,
    onCreateCalendarSource,
  ]);

  const formatSyncStatus = (status: string) =>
    status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^./, (char) => char.toUpperCase());

  const formatProvider = (provider: string) => {
    if (provider.toLowerCase() === 'playmetrics') return 'PlayMetrics';
    return provider.replace(/_/g, ' ');
  };

  const formatSyncedAt = (value?: string | null) => {
    if (!value) return 'Never synced';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Team Settings
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Configure basic details, default game format, formations, and stat
              tracking in one place.
            </p>
          </div>
          {saveSuccess && (
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              Saved
            </div>
          )}
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
            value={statsFeatures}
            onChange={onStatsFeaturesChange}
            variant="grid"
            disabled={loading}
            description="Choose which statistics to track during games. These settings will be the default for all new games."
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

        {/* Calendar Import */}
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Calendar Import
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Connect a PlayMetrics ICS calendar feed to import scheduled
                games for this team. Imports are idempotent, so syncing the same
                feed again updates existing games instead of duplicating them.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              ICS
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label
              htmlFor="calendar-feed-url"
              className="text-sm font-semibold text-slate-800"
            >
              PlayMetrics calendar URL
            </label>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row">
              <input
                id="calendar-feed-url"
                type="url"
                value={calendarFeedUrl}
                onChange={(event) => setCalendarFeedUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleCreateCalendarSource();
                  }
                }}
                placeholder="https://calendar.playmetrics.com/calendars/.../games-calendar.ics"
                className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={creatingCalendarSource}
              />
              <button
                type="button"
                onClick={handleCreateCalendarSource}
                disabled={!canCreateCalendarSource}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {creatingCalendarSource ? 'Connecting…' : 'Connect Feed'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Paste the team games `.ics` URL. The backend validates the URL and
              fetches the feed server-side.
            </p>
          </div>

          {(calendarSourcesError || calendarErrorMessage) && (
            <div className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {calendarErrorMessage || calendarSourcesError}
            </div>
          )}

          {calendarSuccessMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              {calendarSuccessMessage}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Connected feeds
              </h4>
              {calendarSourcesLoading && (
                <span className="text-xs text-slate-500">Loading…</span>
              )}
            </div>

            {!calendarSourcesLoading && calendarSources.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="font-semibold text-slate-900">
                  No calendar feeds connected yet
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Add the first PlayMetrics ICS feed above, then run Sync Now to
                  import this team's schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {calendarSources.map((source) => {
                  const isError =
                    source.lastSyncStatus.toLowerCase() === 'error';
                  const isSuccess =
                    source.lastSyncStatus.toLowerCase() === 'success';

                  return (
                    <div
                      key={source.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">
                              {source.calendarName ||
                                `${formatProvider(source.provider)} calendar`}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                source.enabled
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {source.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isError
                                  ? 'bg-red-100 text-red-700'
                                  : isSuccess
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {formatSyncStatus(source.lastSyncStatus)}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm text-slate-600">
                            {source.feedUrl}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Last sync: {formatSyncedAt(source.lastSyncedAt)}
                          </p>
                          {source.lastSyncError && (
                            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                              {source.lastSyncError}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSyncCalendarSource(source.id)}
                          disabled={syncingCalendarSource}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {syncingCalendarSource ? 'Syncing…' : 'Sync Now'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
