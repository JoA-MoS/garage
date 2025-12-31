import { Link } from 'react-router';

import { useMyDashboard } from '../hooks/use-my-dashboard';
import { useUserProfile } from '../hooks/use-user-profile';

/**
 * Dashboard page - main landing page with game overview
 *
 * Uses the `my` Viewer Pattern to fetch user-scoped data in a single query.
 * @see FEATURE_ROADMAP.md Issue #183
 */
export const DashboardPage = () => {
  const { userDisplayName } = useUserProfile();
  const {
    teams,
    upcomingGames,
    recentGames,
    liveGames,
    hasTeams,
    hasUpcomingGames,
    hasRecentGames,
    hasLiveGames,
    isLoading,
    error,
  } = useMyDashboard({ upcomingLimit: 3, recentLimit: 5 });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-700">
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shadow">
        <h1 className="mb-2 text-3xl font-bold">
          Welcome back, {userDisplayName}!
        </h1>
        <p className="text-blue-100">
          {hasLiveGames
            ? `You have ${liveGames.length} live game${
                liveGames.length > 1 ? 's' : ''
              } in progress!`
            : hasUpcomingGames
            ? 'Check out your upcoming games below.'
            : "Ready to track some soccer stats? Let's get started!"}
        </p>
      </div>

      {/* Live Games Alert */}
      {hasLiveGames && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <h2 className="mb-3 flex items-center text-lg font-semibold text-red-700">
            <span className="mr-2 inline-block h-3 w-3 animate-pulse rounded-full bg-red-500"></span>
            Live Now
          </h2>
          <div className="space-y-2">
            {liveGames.map((game) => {
              const homeTeam = game.gameTeams?.find(
                (gt) => gt.teamType === 'HOME'
              );
              const awayTeam = game.gameTeams?.find(
                (gt) => gt.teamType === 'AWAY'
              );
              return (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="min-h-touch flex flex-col items-center justify-between gap-2 rounded-md bg-white p-3 shadow transition-shadow hover:shadow-md sm:flex-row sm:gap-4"
                >
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <span className="font-medium">
                      {homeTeam?.team?.shortName || homeTeam?.team?.name}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 text-lg font-bold">
                      {homeTeam?.finalScore ?? 0} - {awayTeam?.finalScore ?? 0}
                    </span>
                    <span className="font-medium">
                      {awayTeam?.team?.shortName || awayTeam?.team?.name}
                    </span>
                  </div>
                  <span className="text-sm text-red-600">View Game →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Teams Section */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">My Teams</h2>
          {hasTeams ? (
            <div className="space-y-2">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}`}
                  className="min-h-touch flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-50"
                >
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{
                      backgroundColor: team.homePrimaryColor || '#3b82f6',
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    {team.isManaged && (
                      <span className="text-xs text-blue-600">Manager</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="mb-3">You're not part of any teams yet.</p>
              <Link
                to="/teams"
                className="text-sm text-blue-600 hover:underline"
              >
                Browse teams →
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming Games */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Upcoming Games
          </h2>
          {hasUpcomingGames ? (
            <div className="space-y-3">
              {upcomingGames.map((game) => {
                const homeTeam = game.gameTeams?.find(
                  (gt) => gt.teamType === 'HOME'
                );
                const awayTeam = game.gameTeams?.find(
                  (gt) => gt.teamType === 'AWAY'
                );
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="min-h-touch block rounded-md border border-gray-200 p-3 transition-shadow hover:shadow"
                  >
                    <div className="mb-1 text-sm font-medium text-gray-900">
                      {homeTeam?.team?.shortName || 'TBD'} vs{' '}
                      {awayTeam?.team?.shortName || 'TBD'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {game.scheduledStart
                        ? new Date(game.scheduledStart).toLocaleDateString(
                            undefined,
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }
                          )
                        : 'Time TBD'}
                      {game.venue && ` • ${game.venue}`}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="mb-3">No upcoming games scheduled.</p>
              <Link
                to="/games/new"
                className="text-sm text-blue-600 hover:underline"
              >
                Schedule a game →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Recent Games
          </h2>
          {hasRecentGames ? (
            <div className="space-y-3">
              {recentGames.map((game) => {
                const homeTeam = game.gameTeams?.find(
                  (gt) => gt.teamType === 'HOME'
                );
                const awayTeam = game.gameTeams?.find(
                  (gt) => gt.teamType === 'AWAY'
                );
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="min-h-touch block rounded-md border border-gray-200 p-3 transition-shadow hover:shadow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {homeTeam?.team?.shortName || 'Team'}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-bold">
                        {homeTeam?.finalScore ?? '-'} -{' '}
                        {awayTeam?.finalScore ?? '-'}
                      </span>
                      <span className="text-sm font-medium">
                        {awayTeam?.team?.shortName || 'Team'}
                      </span>
                    </div>
                    <div className="mt-1 text-center text-xs text-gray-500">
                      {game.actualEnd
                        ? new Date(game.actualEnd).toLocaleDateString()
                        : 'Completed'}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="mb-3">No recent games.</p>
              <p className="text-xs">
                Games you play will appear here when completed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-blue-900">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/games/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Start New Game
          </Link>
          <Link
            to="/history"
            className="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
          >
            View All Games
          </Link>
          <Link
            to="/teams"
            className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
          >
            Manage Teams
          </Link>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link
          to="/players"
          className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-3xl">👥</div>
          <h3 className="font-medium text-gray-900">Players</h3>
          <p className="text-sm text-gray-600">Manage player profiles</p>
        </Link>

        <Link
          to="/teams"
          className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-3xl">🏆</div>
          <h3 className="font-medium text-gray-900">Teams</h3>
          <p className="text-sm text-gray-600">Team management</p>
        </Link>

        <Link
          to="/analytics"
          className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-3xl">📊</div>
          <h3 className="font-medium text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600">Performance insights</p>
        </Link>

        <Link
          to="/settings"
          className="rounded-lg bg-white p-6 text-center shadow transition-shadow hover:shadow-md"
        >
          <div className="mb-2 text-3xl">⚙️</div>
          <h3 className="font-medium text-gray-900">Settings</h3>
          <p className="text-sm text-gray-600">App configuration</p>
        </Link>
      </div>
    </div>
  );
};
