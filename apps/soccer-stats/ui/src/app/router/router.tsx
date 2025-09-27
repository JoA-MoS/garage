import { createBrowserRouter, Navigate } from 'react-router';

import { Layout } from '../components/layout/layout';
import { DashboardPage } from '../pages/dashboard.page';
// import { NewGamePage } from '../pages/new-game.page';
import { HistoryPage } from '../pages/history.page';
import { PlayersPage } from '../pages/players.page';
import { UsersPage } from '../pages/users.page';
import { TeamsPage } from '../pages/teams.page';
import { EditTeamPage } from '../pages/edit-team.page';
import { TeamConfigurationPage } from '../pages/team-configuration.page';
// import { AddPlayersPage } from '../pages/add-players.page';
import { TeamManagementPage } from '../pages/team-management.page';
import { AnalyticsPage } from '../pages/analytics.page';
import { SettingsPage } from '../pages/settings.page';
import { AboutPage } from '../pages/about.page';
// import { TeamPlayersPage } from '../pages/team-players.page';
import { TeamGamesPage } from '../pages/team-games.page';
import { TeamOverviewPage } from '../pages/team-overview.page';
import { TeamStatsPage } from '../pages/team-stats.page';
import { TeamSettingsPage } from '../pages/team-settings.page';
import { GameLayout } from '../components/layout/game-layout';
import { TeamLayout } from '../components/layout/team-layout';
import { HomeLineupView } from '../components/views/home-lineup.view';
import { AwayLineupView } from '../components/views/away-lineup.view';
import { RosterView } from '../components/views/roster.view';
import { StatsView } from '../components/views/stats.view';
import { SubstitutionsView } from '../components/views/substitutions.view';
import { GameProvider } from '../context/game.context';

// const GameWithProvider = () => (
//   <GameProvider>
//     <GameLayout />
//   </GameProvider>
// );

// const NewGameWithProvider = () => (
//   <GameProvider>
//     <NewGamePage />
//   </GameProvider>
// );

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // {
      //   path: 'game/new',
      //   element: <NewGameWithProvider />,
      // },
      // {
      //   path: 'game/:gameId',
      //   element: <GameWithProvider />,
      //   children: [
      //     {
      //       index: true,
      //       element: <Navigate to="lineup/home" replace />,
      //     },
      //     {
      //       path: 'lineup/home',
      //       element: <HomeLineupView />,
      //     },
      //     {
      //       path: 'lineup/away',
      //       element: <AwayLineupView />,
      //     },
      //     {
      //       path: 'roster',
      //       element: <RosterView />,
      //     },
      //     {
      //       path: 'stats',
      //       element: <StatsView />,
      //     },
      //     {
      //       path: 'substitutions',
      //       element: <SubstitutionsView />,
      //     },
      //   ],
      // },
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
        path: 'teams/manage',
        element: <TeamManagementPage />,
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
            // element: <TeamPlayersPage />,
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
          // Legacy routes for compatibility
          {
            path: 'manage',
            element: <TeamManagementPage />,
          },
          {
            path: 'edit',
            element: <EditTeamPage />,
          },
          {
            path: 'configure',
            element: <TeamConfigurationPage />,
          },
          // {
          //   path: 'add-players',
          //   element: <AddPlayersPage />,
          // },
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
