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
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 text-white shadow">
        <div>
          <h1 className="text-xl font-bold leading-tight">{userDisplayName}</h1>
          <p className="text-xs text-blue-200">
            {hasLiveGames
              ? `${liveGames.length} live game${liveGames.length > 1 ? 's' : ''} in progress`
              : hasUpcomingGames
                ? `${upcomingGames.length} upcoming game${upcomingGames.length > 1 ? 's' : ''}`
                : 'No upcoming games'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/games/new"
            className="rounded bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
          >
            + New Game
          </Link>
          <Link
            to="/history"
            className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            History
          </Link>
        </div>
      </div>

      {/* Live Games Alert */}
      {hasLiveGames && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
            Live Now
          </div>
          <div className="space-y-1.5">
            {liveGames.map((game) => {
              const homeTeam = game.teams?.find((gt) => gt.teamType === 'HOME');
              const awayTeam = game.teams?.find((gt) => gt.teamType === 'AWAY');
              return (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="flex items-center justify-between rounded bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow"
                >
                  <span className="text-sm font-medium">
                    {homeTeam?.team?.shortName || homeTeam?.team?.name}
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-bold tabular-nums">
                    {homeTeam?.finalScore ?? 0} – {awayTeam?.finalScore ?? 0}
                  </span>
                  <span className="text-sm font-medium">
                    {awayTeam?.team?.shortName || awayTeam?.team?.name}
                  </span>
                  <span className="text-xs text-red-600">View →</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Teams */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              My Teams
            </h2>
            <Link to="/teams" className="text-xs text-blue-600 hover:underline">
              Manage →
            </Link>
          </div>
          <div className="p-2">
            {hasTeams ? (
              <div className="space-y-0.5">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="flex items-center gap-2.5 rounded px-2 py-1.5 transition-colors hover:bg-gray-50"
                  >
                    <div
                      className="h-6 w-6 shrink-0 rounded-full border border-gray-200"
                      style={{
                        backgroundColor: team.homePrimaryColor || '#3b82f6',
                      }}
                    />
                    <span className="truncate text-sm font-medium text-gray-900">
                      {team.name}
                    </span>
                    {team.isManaged && (
                      <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        Manager
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                <p className="mb-2">Not part of any teams yet.</p>
                <Link to="/teams" className="text-blue-600 hover:underline">
                  Browse teams →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Games */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Upcoming
            </h2>
            <Link
              to="/games/new"
              className="text-xs text-blue-600 hover:underline"
            >
              + Schedule
            </Link>
          </div>
          <div className="p-2">
            {hasUpcomingGames ? (
              <div className="space-y-0.5">
                {upcomingGames.map((game) => {
                  const homeTeam = game.teams?.find(
                    (gt) => gt.teamType === 'HOME',
                  );
                  const awayTeam = game.teams?.find(
                    (gt) => gt.teamType === 'AWAY',
                  );
                  return (
                    <Link
                      key={game.id}
                      to={`/games/${game.id}`}
                      className="block rounded px-2 py-1.5 transition-colors hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">
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
                              },
                            )
                          : 'Time TBD'}
                        {game.venue && ` • ${game.venue}`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                No upcoming games scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Recent Games */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Recent
            </h2>
            <Link
              to="/history"
              className="text-xs text-blue-600 hover:underline"
            >
              All →
            </Link>
          </div>
          <div className="p-2">
            {hasRecentGames ? (
              <div className="space-y-0.5">
                {recentGames.map((game) => {
                  const homeTeam = game.teams?.find(
                    (gt) => gt.teamType === 'HOME',
                  );
                  const awayTeam = game.teams?.find(
                    (gt) => gt.teamType === 'AWAY',
                  );
                  return (
                    <Link
                      key={game.id}
                      to={`/games/${game.id}`}
                      className="flex items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-gray-50"
                    >
                      <span className="truncate text-sm text-gray-700">
                        {homeTeam?.team?.shortName || 'Team'}
                      </span>
                      <span className="mx-auto shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-bold tabular-nums">
                        {homeTeam?.finalScore ?? '–'} –{' '}
                        {awayTeam?.finalScore ?? '–'}
                      </span>
                      <span className="truncate text-right text-sm text-gray-700">
                        {awayTeam?.team?.shortName || 'Team'}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400">
                        {game.actualEnd
                          ? new Date(game.actualEnd).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )
                          : ''}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                No recent games.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { to: '/players', icon: '👥', label: 'Players' },
          { to: '/teams', icon: '🏆', label: 'Teams' },
          { to: '/analytics', icon: '📊', label: 'Analytics' },
          { to: '/settings', icon: '⚙️', label: 'Settings' },
        ].map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow transition-shadow hover:shadow-md"
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
