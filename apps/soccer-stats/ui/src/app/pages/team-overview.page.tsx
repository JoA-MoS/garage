import { Link, useParams } from 'react-router';
import { useQuery } from '@apollo/client/react';

import { GetTeamByIdQuery } from '@garage/soccer-stats/graphql-codegen';

import { GET_TEAM_BY_ID } from '../services/teams-graphql.service';

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statCard(
  label: string,
  value: string | number,
  helper: string,
  icon: string,
) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <span
          className="rounded-2xl bg-blue-50 p-3 text-2xl"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

/**
 * Page component for team overview information
 */
export const TeamOverviewPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  const { data, loading, error, refetch } = useQuery<GetTeamByIdQuery>(
    GET_TEAM_BY_ID,
    {
      variables: { id: teamId },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !teamId,
    },
  );

  if (!teamId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        Error: No team ID provided
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl bg-slate-200/80"
          />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <div className="text-lg font-semibold">Error loading team</div>
        <div className="mt-2 text-sm">{error.message}</div>
        <button
          onClick={() => refetch()}
          className="mt-4 min-h-[44px] rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // TODO: Implement mapServiceTeamToUITeam when migrating to new architecture
  // For now, use data.team directly
  const team = data?.team || null;

  if (!team) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        <div className="text-lg font-semibold">Team not found</div>
      </div>
    );
  }

  const roster = team.roster ?? [];
  const activePlayers = roster.filter((player) => player.teamMember.isActive);
  const games = team.games ?? [];
  const teamColor = team.homePrimaryColor || '#2563eb';
  const upcomingGames = games
    .filter((game) => game.game?.scheduledStart)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.game?.scheduledStart ?? 0).getTime() -
        new Date(b.game?.scheduledStart ?? 0).getTime(),
    )
    .slice(0, 3);

  const ownerName = team.owner
    ? `${team.owner.user.firstName ?? ''} ${team.owner.user.lastName ?? ''}`.trim() ||
      team.owner.user.email
    : 'Not assigned';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {statCard(
          'Active Players',
          activePlayers.length,
          `${roster.length} total roster spots`,
          '👥',
        )}
        {statCard(
          'Games Tracked',
          games.length,
          'Scheduled and historical games',
          '⚽',
        )}
        {statCard(
          'Default Format',
          team.teamConfiguration?.defaultGameFormat?.name ?? 'Unset',
          team.teamConfiguration?.defaultFormation
            ? `Formation ${team.teamConfiguration.defaultFormation}`
            : 'Set a format in Settings',
          '📋',
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Team Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">
              The essentials at a glance, without making you hunt through
              settings.
            </p>
          </div>
          <div className="grid gap-0 divide-y divide-slate-100 p-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <dl className="space-y-4 pb-5 sm:pb-0 sm:pr-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {team.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Owner
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {ownerName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatDate(team.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="space-y-4 pt-5 sm:pl-5 sm:pt-0">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Team Colors
                </h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[
                    ['Home primary', team.homePrimaryColor],
                    ['Home secondary', team.homeSecondaryColor],
                    ['Away primary', team.awayPrimaryColor],
                    ['Away secondary', team.awaySecondaryColor],
                  ].map(([label, color]) => (
                    <div
                      key={label}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <span
                        className="h-6 w-6 flex-shrink-0 rounded-lg border border-slate-300"
                        style={{ backgroundColor: color || '#f8fafc' }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-700">
                          {label}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {color || 'Unset'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Team ID
                </h3>
                <p className="mt-2 break-all rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-600">
                  {team.id}
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Next best actions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Common team-management tasks, one tap away.
          </p>
          <div className="mt-5 grid gap-3">
            <Link
              to={`/teams/${teamId}/players`}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="font-semibold text-slate-950">Manage roster</div>
              <div className="mt-1 text-sm text-slate-500">
                Add players, jersey numbers, and positions.
              </div>
            </Link>
            <Link
              to={`/teams/${teamId}/games`}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="font-semibold text-slate-950">
                Create or review games
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Schedule matches before tracking stats.
              </div>
            </Link>
            <Link
              to={`/teams/${teamId}/settings`}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="font-semibold text-slate-950">
                Tune team setup
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Update colors, format, formations, and stat options.
              </div>
            </Link>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Upcoming games</h2>
            <p className="text-sm text-slate-500">
              The next scheduled items for this team.
            </p>
          </div>
          <Link
            to={`/teams/${teamId}/games`}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            View all games →
          </Link>
        </div>

        {upcomingGames.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {upcomingGames.map((game) => (
              <div key={game.id} className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">
                  {game.game?.name || 'Game'}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {formatDate(game.game?.scheduledStart)}
                </div>
                <div
                  className="mt-3 h-1.5 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="text-3xl" aria-hidden="true">
              ⚽
            </div>
            <h3 className="mt-3 font-semibold text-slate-950">
              No games scheduled yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a game when the schedule is ready.
            </p>
            <Link
              to={`/teams/${teamId}/games`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Go to games
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};
