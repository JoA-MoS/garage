import { UITeam } from '../types/ui.types';

interface TeamDetailPresentationProps {
  team: UITeam;
  activeTab: 'overview' | 'players' | 'games' | 'stats';
  onGoBack: () => void;
  onTabChange: (tab: 'overview' | 'players' | 'games' | 'stats') => void;
  onRefresh: () => void;
  isLoading: boolean;
  playersComponent: React.ReactNode;
  gamesComponent: React.ReactNode;
}

/**
 * Presentation component for displaying team details with tab navigation
 */
export const TeamDetailPresentation = ({
  team,
  activeTab,
  onGoBack,
  onTabChange,
  onRefresh,
  isLoading,
  playersComponent,
  gamesComponent,
}: TeamDetailPresentationProps) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '🏠' },
    { id: 'players' as const, label: 'Players', icon: '👥' },
    { id: 'games' as const, label: 'Games', icon: '⚽' },
    { id: 'stats' as const, label: 'Statistics', icon: '📊' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onGoBack}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-xl mr-2">←</span>
                <span className="text-sm font-medium">Back to Teams</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {isLoading ? '⟳' : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
              style={{ backgroundColor: team.primaryColor }}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
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
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: team.primaryColor }}
                  />
                  <span>{team.primaryColor}</span>
                </div>
                {team.secondaryColor && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Secondary Color:</span>
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: team.secondaryColor }}
                    />
                    <span>{team.secondaryColor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 sm:px-6 py-4 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Team Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{team.name}</span>
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
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

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Team Colors
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      <div>
                        <div className="text-sm font-medium">Primary</div>
                        <div className="text-xs text-gray-600">
                          {team.primaryColor}
                        </div>
                      </div>
                    </div>
                    {team.secondaryColor && (
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: team.secondaryColor }}
                        />
                        <div>
                          <div className="text-sm font-medium">Secondary</div>
                          <div className="text-xs text-gray-600">
                            {team.secondaryColor}
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
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <span className="text-4xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Statistics
              </h3>
              <p className="text-gray-600 mb-6">
                Detailed statistics and analytics will be displayed here.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-600">Goals Scored</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Assists</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">0h</div>
                  <div className="text-sm text-gray-600">Play Time</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
