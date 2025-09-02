import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';

import { Layout } from '../components/layout/layout';
import { DashboardPage } from '../pages/dashboard.page';
import { NewGamePage } from '../pages/new-game.page';
import { HistoryPage } from '../pages/history.page';
import { PlayersPage } from '../pages/players.page';
import { TeamsPage } from '../pages/teams.page';
import { AnalyticsPage } from '../pages/analytics.page';
import { SettingsPage } from '../pages/settings.page';
import { AboutPage } from '../pages/about.page';
import { GameLayout } from '../components/layout/game-layout';
import { HomeLineupView } from '../components/views/home-lineup.view';
import { AwayLineupView } from '../components/views/away-lineup.view';
import { RosterView } from '../components/views/roster.view';
import { StatsView } from '../components/views/stats.view';
import { SubstitutionsView } from '../components/views/substitutions.view';
import { GameProvider } from '../context/game.context';

const GameWithProvider = () => (
  <GameProvider>
    <GameLayout />
  </GameProvider>
);

const NewGameWithProvider = () => (
  <GameProvider>
    <NewGamePage />
  </GameProvider>
);

export const router = createBrowserRouter([
  {
    path: '/sign-in/*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SignIn 
          routing="path" 
          path="/sign-in" 
          appearance={{
            baseTheme: undefined, // Can be configured for dark theme
          }}
        />
      </div>
    ),
  },
  {
    path: '/sign-up/*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SignUp 
          routing="path" 
          path="/sign-up" 
          appearance={{
            baseTheme: undefined, // Can be configured for dark theme
          }}
        />
      </div>
    ),
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'game/new',
        element: <NewGameWithProvider />,
      },
      {
        path: 'game/:gameId',
        element: <GameWithProvider />,
        children: [
          {
            index: true,
            element: <Navigate to="lineup/home" replace />,
          },
          {
            path: 'lineup/home',
            element: <HomeLineupView />,
          },
          {
            path: 'lineup/away',
            element: <AwayLineupView />,
          },
          {
            path: 'roster',
            element: <RosterView />,
          },
          {
            path: 'stats',
            element: <StatsView />,
          },
          {
            path: 'substitutions',
            element: <SubstitutionsView />,
          },
        ],
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
        path: 'teams',
        element: <TeamsPage />,
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
