import {
  useParams,
  useNavigate,
  useLocation,
  Link,
  Outlet,
} from 'react-router';
import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';

const fallbackTeamColor = '#2563eb';

function readableTeamColor(color?: string | null) {
  return color?.trim() || fallbackTeamColor;
}

/**
 * Layout component that provides common navigation and header for team pages
 */
export const TeamLayout = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, loading } = useQuery<TeamResponse>(GET_TEAM_BY_ID, {
    variables: { id: teamId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !teamId,
  });

  if (!teamId) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Error: No team ID provided
        </div>
      </div>
    );
  }

  // TODO: Implement mapServiceTeamToUITeam when migrating to new architecture
  // const team = data?.team ? mapServiceTeamToUITeam(data.team) : null;
  const team = data?.team || null;
  const teamColor = readableTeamColor(team?.homePrimaryColor);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '🏠',
      path: `/teams/${teamId}/overview`,
    },
    {
      id: 'players',
      label: 'Players',
      icon: '👥',
      path: `/teams/${teamId}/players`,
    },
    { id: 'games', label: 'Games', icon: '⚽', path: `/teams/${teamId}/games` },
    {
      id: 'stats',
      label: 'Statistics',
      icon: '📊',
      path: `/teams/${teamId}/stats`,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: `/teams/${teamId}/settings`,
    },
  ];

  const currentTab = tabs.find(
    (tab) =>
      location.pathname === tab.path ||
      location.pathname.startsWith(`${tab.path}/`),
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="relative isolate px-4 py-5 text-white sm:px-6 sm:py-7"
          style={{
            background: `linear-gradient(135deg, ${teamColor}, #0f172a 72%)`,
          }}
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_34%)]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/teams')}
                className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-label="Back to teams"
              >
                ←
              </button>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/75">
                  <span>Teams</span>
                  <span aria-hidden="true">/</span>
                  <span>{currentTab?.label ?? 'Team'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/95 text-2xl font-black shadow-sm"
                    style={{ color: teamColor }}
                  >
                    {team?.name?.charAt(0).toUpperCase() ?? 'T'}
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-black tracking-tight sm:text-4xl">
                      {team?.name ?? (loading ? 'Loading team…' : 'Team')}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
                      {team?.shortName && (
                        <span className="rounded-full bg-white/15 px-2.5 py-1 font-semibold text-white">
                          {team.shortName}
                        </span>
                      )}
                      <span>
                        {team?.isManaged ? 'Managed team' : 'Unmanaged team'}
                      </span>
                      {team?.createdAt && (
                        <span>
                          Created{' '}
                          {new Date(team.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav
          className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-slate-50/80 px-3 py-3 sm:px-5"
          aria-label="Team navigation"
        >
          {tabs.map((tab) => {
            const isActive = currentTab?.id === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </section>

      <main className="mt-6">
        <Outlet />
      </main>
    </div>
  );
};
