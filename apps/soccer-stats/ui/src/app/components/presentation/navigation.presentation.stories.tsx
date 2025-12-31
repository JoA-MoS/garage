import { NavigationPresentation } from './navigation.presentation';

const meta = {
  title: 'Components/Presentation/Navigation',
  component: NavigationPresentation,
  parameters: {
    layout: 'fullscreen',
    // Mock React Router for stories
    reactRouter: {
      routePath: '/*',
      routeParams: {},
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Since NavigationPresentation doesn't take props and uses hooks,
// we'll create different scenarios by mocking different routes

export const Dashboard = {
  parameters: {
    reactRouter: {
      location: { pathname: '/' },
    },
  },
};

export const NewGame = {
  parameters: {
    reactRouter: {
      location: { pathname: '/games/new' },
    },
  },
};

export const History = {
  parameters: {
    reactRouter: {
      location: { pathname: '/history' },
    },
  },
};

export const Players = {
  parameters: {
    reactRouter: {
      location: { pathname: '/players' },
    },
  },
};

export const Teams = {
  parameters: {
    reactRouter: {
      location: { pathname: '/teams' },
    },
  },
};

export const Analytics = {
  parameters: {
    reactRouter: {
      location: { pathname: '/analytics' },
    },
  },
};

export const Settings = {
  parameters: {
    reactRouter: {
      location: { pathname: '/settings' },
    },
  },
};

export const GameSubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/games/123/lineup' },
    },
  },
};

export const TeamsSubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/teams/manage' },
    },
  },
};

export const PlayersSubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/players/add' },
    },
  },
};

export const HistorySubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/history/2024' },
    },
  },
};

export const AnalyticsSubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/analytics/performance' },
    },
  },
};

export const SettingsSubRoute = {
  parameters: {
    reactRouter: {
      location: { pathname: '/settings/profile' },
    },
  },
};

// Demonstration of all navigation states
export const AllNavigationStates = {
  render: () => {
    const routes = [
      '/',
      '/games/new',
      '/history',
      '/players',
      '/teams',
      '/analytics',
      '/settings',
    ];

    return (
      <div className="space-y-4">
        {routes.map((route) => (
          <div key={route}>
            <h3 className="mb-2 text-lg font-semibold">
              Navigation for: {route === '/' ? 'Dashboard' : route}
            </h3>
            <div className="overflow-hidden rounded-lg border">
              {/* This would need to be wrapped with Router provider with specific location */}
              <NavigationPresentation />
            </div>
          </div>
        ))}
      </div>
    );
  },
};
