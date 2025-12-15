import { createBrowserRouter, Navigate } from 'react-router';

import { Layout } from '../components/layout/layout';
import { DashboardPage } from '../pages/dashboard.page';
import { HistoryPage } from '../pages/history.page';
import { PlayersPage } from '../pages/players.page';
import { UsersPage } from '../pages/users.page';
import { TeamsPage } from '../pages/teams.page';
import { CreateTeamPage } from '../pages/create-team.page';
import { EditTeamPage } from '../pages/edit-team.page';
import { AnalyticsPage } from '../pages/analytics.page';
import { SettingsPage } from '../pages/settings.page';
import { AboutPage } from '../pages/about.page';
import { TeamPlayersPage } from '../pages/team-players.page';
import { TeamGamesPage } from '../pages/team-games.page';
import { TeamOverviewPage } from '../pages/team-overview.page';
import { TeamStatsPage } from '../pages/team-stats.page';
import { TeamSettingsPage } from '../pages/team-settings.page';
import { AllGamesPage } from '../pages/all-games.page';
import { TeamLayout } from '../components/layout/team-layout';
import { GamePage } from '../pages/game.page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'game/:gameId',
        element: <GamePage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'players',
        element: <PlayersPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'teams',
        element: <TeamsPage />,
      },
      {
        path: 'games',
        element: <AllGamesPage />,
      },
      {
        path: 'teams/new',
        element: <CreateTeamPage />,
      },
      {
        path: 'teams/:teamId',
        element: <TeamLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: <TeamOverviewPage />,
          },
          {
            path: 'players',
            element: <TeamPlayersPage />,
          },
          {
            path: 'games',
            element: <TeamGamesPage />,
          },
          {
            path: 'stats',
            element: <TeamStatsPage />,
          },
          {
            path: 'settings',
            element: <TeamSettingsPage />,
          },
          {
            path: 'edit',
            element: <EditTeamPage />,
          },
        ],
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
    ],
  },
]);
