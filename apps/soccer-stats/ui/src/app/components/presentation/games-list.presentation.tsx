/**
 * Layer 1: Pure Presentation Component for Games List
 * - Zero business logic or GraphQL dependencies
 * - Receives individual typed props, not objects
 * - Mobile-first responsive design with Tailwind CSS
 * - Touch-friendly interfaces with 44px minimum touch targets
 */

interface GamePresentationData {
  id: string;
  name: string;
  scheduledStart: string;
  venue?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  homeTeam: {
    id: string;
    name: string;
  };
  awayTeam: {
    id: string;
    name: string;
  };
  homeScore?: number;
  awayScore?: number;
  gameFormatName?: string;
}

interface GamesListPresentationProps {
  games: GamePresentationData[];
  loading?: boolean;
  error?: string;
  onGameClick: (gameId: string) => void;
}

export const GamesListPresentation = ({
  games,
  loading = false,
  error,
  onGameClick,
}: GamesListPresentationProps) => {
  // Helper function to format date for mobile-friendly display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Helper function to get status badge styling
  const getStatusBadgeClasses = (status: GamePresentationData['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-600">Loading games...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center">
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
            <p className="font-medium text-red-700">Error loading games</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto mb-4 h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          No games found
        </h3>
        <p className="text-gray-600">There are currently no games scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          All Games
        </h1>
        <div className="text-sm text-gray-600">
          {games.length} {games.length === 1 ? 'game' : 'games'}
        </div>
      </div>

      {/* Mobile-first games list */}
      <div
        className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2 sm:gap-6
        lg:grid-cols-3 lg:gap-8
      "
      >
        {games.map((game) => {
          const { date, time } = formatDate(game.scheduledStart);

          return (
            <div
              key={game.id}
              onClick={() => onGameClick(game.id)}
              className="
                /* Mobile-first card styling */
                /* Touch-friendly minimum size and
                spacing */ /* Progressive
                
                enhancement for larger screens */ /* Touch
                feedback */
                
                min-h-[120px] cursor-pointer space-y-3 rounded-lg border border-gray-200 bg-white
                p-4 shadow-sm transition-all
                duration-200 active:scale-95
                
                active:bg-gray-50 sm:min-h-[140px] sm:space-y-4 sm:p-6
                lg:hover:border-blue-300 lg:hover:shadow-md
              "
            >
              {/* Header with status badge */}
              <div className="flex items-start justify-between">
                <h3
                  className="
                  text-lg font-semibold leading-tight text-gray-900
                  sm:text-xl
                "
                >
                  {game.name}
                </h3>
                <span
                  className={`
                  rounded-full border px-2 py-1 text-xs font-medium
                  ${getStatusBadgeClasses(game.status)}
                `}
                >
                  {game.status.replace('_', ' ')}
                </span>
              </div>

              {/* Teams */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">
                    {game.homeTeam.name}
                  </span>
                  {typeof game.homeScore === 'number' && (
                    <span className="text-lg font-bold text-gray-900">
                      {game.homeScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">
                    {game.awayTeam.name}
                  </span>
                  {typeof game.awayScore === 'number' && (
                    <span className="text-lg font-bold text-gray-900">
                      {game.awayScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Game details */}
              <div className="border-t border-gray-100 pt-2">
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span className="flex items-center">
                    <svg
                      className="mr-1 h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {date} at {time}
                  </span>
                  {game.venue && (
                    <span className="flex items-center">
                      <svg
                        className="mr-1 h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {game.venue}
                    </span>
                  )}
                  {game.gameFormatName && (
                    <span className="flex items-center">
                      <svg
                        className="mr-1 h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {game.gameFormatName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
