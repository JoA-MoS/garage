interface TeamStatsPresentationProps {
  // Team basic info
  teamName: string;
  playerCount: number;

  // Game statistics
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;

  // Team performance statistics
  goalsScored: number;
  assists: number;
  playTimeHours: number;
  redCards: number;

  // Player statistics
  activePlayerCount: number;
  topScorerName?: string;
  topAssisterName?: string;
  mostMinutesPlayerName?: string;

  // UI state
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const TeamStatsPresentation = ({
  teamName,
  playerCount,
  gamesPlayed,
  wins,
  draws,
  losses,
  winRate,
  goalsScored,
  assists,
  playTimeHours,
  redCards,
  activePlayerCount,
  topScorerName,
  topAssisterName,
  mostMinutesPlayerName,
  isLoading = false,
  error,
  onRetry,
}: TeamStatsPresentationProps) => {
  if (error) {
    return (
      <div className="p-4 text-center text-red-600 sm:p-6 md:p-8">
        <div className="text-lg font-semibold">Error loading team</div>
        <div className="mt-2 text-sm">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              mt-4 min-h-[44px] min-w-[44px] rounded bg-blue-600 px-4 py-3 text-white 
              transition-colors active:scale-95
              sm:py-2
              lg:hover:bg-blue-700
            "
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="
      rounded-lg bg-white p-4 shadow-lg
      sm:p-6
      md:p-8
    "
    >
      <div className="py-12 text-center">
        {/* Header */}
        <div className="mb-4 text-gray-500">
          <span className="text-4xl" role="img" aria-label="Statistics chart">
            📊
          </span>
        </div>
        <h3
          className="
          mb-2 text-lg font-semibold text-gray-900
          sm:text-xl
          md:text-2xl
        "
        >
          {teamName} Statistics
        </h3>
        <p
          className="
          mb-6 text-gray-600
          sm:text-lg
        "
        >
          Detailed statistics and analytics for the team.
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="mb-8">
            <div className="animate-pulse text-gray-500">
              Loading statistics...
            </div>
          </div>
        )}

        {/* Statistics Grid */}
        <div
          className="
          mx-auto mb-8 grid max-w-4xl grid-cols-1 gap-4
          sm:grid-cols-2 sm:gap-6
          lg:grid-cols-4 lg:gap-8
        "
        >
          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <div
              className="
              text-2xl font-bold text-blue-600
              sm:text-3xl
            "
            >
              {goalsScored}
            </div>
            <div
              className="
              text-sm text-gray-600
              sm:text-base
            "
            >
              Goals Scored
            </div>
          </div>

          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <div
              className="
              text-2xl font-bold text-green-600
              sm:text-3xl
            "
            >
              {assists}
            </div>
            <div
              className="
              text-sm text-gray-600
              sm:text-base
            "
            >
              Assists
            </div>
          </div>

          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <div
              className="
              text-2xl font-bold text-purple-600
              sm:text-3xl
            "
            >
              {playTimeHours}h
            </div>
            <div
              className="
              text-sm text-gray-600
              sm:text-base
            "
            >
              Play Time
            </div>
          </div>

          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <div
              className="
              text-2xl font-bold text-red-600
              sm:text-3xl
            "
            >
              {redCards}
            </div>
            <div
              className="
              text-sm text-gray-600
              sm:text-base
            "
            >
              Red Cards
            </div>
          </div>
        </div>

        {/* Additional Stats Sections */}
        <div
          className="
          mx-auto grid max-w-4xl grid-cols-1 gap-6
          md:grid-cols-2
        "
        >
          {/* Game Performance Section */}
          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <h4
              className="
              mb-3 text-lg font-semibold text-gray-900
              sm:text-xl
            "
            >
              Game Performance
            </h4>
            <div
              className="
              space-y-2 text-sm
              sm:space-y-3 sm:text-base
            "
            >
              <div className="flex justify-between">
                <span className="text-gray-600">Games Played:</span>
                <span className="font-medium">{gamesPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wins:</span>
                <span className="font-medium text-green-600">{wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Draws:</span>
                <span className="font-medium text-yellow-600">{draws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Losses:</span>
                <span className="font-medium text-red-600">{losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Win Rate:</span>
                <span className="font-medium">{winRate}%</span>
              </div>
            </div>
          </div>

          {/* Player Statistics Section */}
          <div
            className="
            rounded-lg bg-gray-50 p-4
            sm:p-6
          "
          >
            <h4
              className="
              mb-3 text-lg font-semibold text-gray-900
              sm:text-xl
            "
            >
              Player Statistics
            </h4>
            <div
              className="
              space-y-2 text-sm
              sm:space-y-3 sm:text-base
            "
            >
              <div className="flex justify-between">
                <span className="text-gray-600">Total Players:</span>
                <span className="font-medium">{playerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Players:</span>
                <span className="font-medium">{activePlayerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Scorer:</span>
                <span className="font-medium">{topScorerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Top Assister:</span>
                <span className="font-medium">{topAssisterName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Most Minutes:</span>
                <span className="font-medium">
                  {mostMinutesPlayerName || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
