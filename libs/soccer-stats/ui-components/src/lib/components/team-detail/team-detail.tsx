import { memo } from 'react';

import type { UITeam } from '../../types';

/** Owner information for the team */
export interface TeamOwner {
  firstName: string;
  lastName: string;
}

/** Available tabs in the team detail view */
export type TeamDetailTab = 'overview' | 'players' | 'games' | 'stats';

export interface TeamDetailProps {
  /** The team being displayed */
  team: UITeam;
  /** Optional owner information */
  owner?: TeamOwner | null;
  /** Currently active tab */
  activeTab: TeamDetailTab;
  /** Callback when back button is clicked */
  onGoBack: () => void;
  /** Callback when tab changes */
  onTabChange: (tab: TeamDetailTab) => void;
  /** Callback when refresh button is clicked */
  onRefresh: () => void;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Component to render in the players tab (slot pattern) */
  playersComponent: React.ReactNode;
  /** Component to render in the games tab (slot pattern) */
  gamesComponent: React.ReactNode;
  /** Optional component to render in the stats tab (slot pattern) */
  statsComponent?: React.ReactNode;
}

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: '🏠' },
  { id: 'players' as const, label: 'Players', icon: '👥' },
  { id: 'games' as const, label: 'Games', icon: '⚽' },
  { id: 'stats' as const, label: 'Statistics', icon: '📊' },
];

/**
 * TeamDetail displays comprehensive team information with tabbed navigation.
 * Uses the slot pattern for players/games content, allowing consuming apps
 * to inject their own smart components.
 */
export const TeamDetail = memo(function TeamDetail({
  team,
  owner,
  activeTab,
  onGoBack,
  onTabChange,
  onRefresh,
  isLoading,
  playersComponent,
  gamesComponent,
  statsComponent,
}: TeamDetailProps) {
  const primaryColor = team.homePrimaryColor || team.primaryColor || '#3B82F6';
  const secondaryColor =
    team.homeSecondaryColor || team.secondaryColor || '#FFFFFF';

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={onGoBack}
                className="flex min-h-[44px] items-center text-gray-600 transition-colors lg:hover:text-gray-800"
              >
                <span className="mr-2 text-xl">←</span>
                <span className="text-sm font-medium">Back to Teams</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="min-h-[44px] rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors disabled:opacity-50 lg:hover:bg-gray-200"
              >
                {isLoading ? '⟳' : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="px-4 py-6 sm:px-6">
          <div className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-6 sm:space-y-0">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                {team.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Created:</span>
                  <span>
                    {team.createdAt
                      ? new Date(team.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Primary Color:</span>
                  <div
                    className="h-4 w-4 rounded border border-gray-300"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span>{primaryColor}</span>
                </div>
                {secondaryColor && secondaryColor !== '#FFFFFF' && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Secondary Color:</span>
                    <div
                      className="h-4 w-4 rounded border border-gray-300"
                      style={{ backgroundColor: secondaryColor }}
                    />
                    <span>{secondaryColor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex min-h-[44px] items-center space-x-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm
                  font-medium transition-colors sm:px-6
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-transparent text-gray-500 lg:hover:border-gray-300 lg:hover:text-gray-700'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Team Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium">
                        {owner
                          ? `${owner.firstName} ${owner.lastName}`
                          : 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {team.createdAt
                          ? new Date(team.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">{team.id}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Quick Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Players:</span>
                      <span className="font-medium">
                        {team.playerCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Games Played:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Team Colors
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="h-8 w-8 rounded border border-gray-300"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <div>
                        <div className="text-sm font-medium">Primary</div>
                        <div className="text-xs text-gray-600">
                          {primaryColor}
                        </div>
                      </div>
                    </div>
                    {secondaryColor && (
                      <div className="flex items-center space-x-3">
                        <div
                          className="h-8 w-8 rounded border border-gray-300"
                          style={{ backgroundColor: secondaryColor }}
                        />
                        <div>
                          <div className="text-sm font-medium">Secondary</div>
                          <div className="text-xs text-gray-600">
                            {secondaryColor}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-gray-500">
                <p>
                  Use the tabs above to manage players, view games, and analyze
                  statistics.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'players' && <div>{playersComponent}</div>}

          {activeTab === 'games' && <div>{gamesComponent}</div>}

          {activeTab === 'stats' && (
            <div>
              {statsComponent || (
                <div className="py-12 text-center">
                  <div className="mb-4 text-gray-500">
                    <span className="text-4xl">📊</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Team Statistics
                  </h3>
                  <p className="mb-6 text-gray-600">
                    Detailed statistics and analytics will be displayed here.
                  </p>
                  <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-gray-600">Goals Scored</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-600">Assists</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        0h
                      </div>
                      <div className="text-sm text-gray-600">Play Time</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
