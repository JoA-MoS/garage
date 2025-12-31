import { GameNavigationPresentation } from './game-navigation.presentation';

const meta = {
  title: 'Components/Presentation/GameNavigation',
  component: GameNavigationPresentation,
  parameters: {
    layout: 'padded',
    // Mock React Router for stories
    reactRouter: {
      routePath: '/games/:gameId/*',
      routeParams: { gameId: '123' },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentPath: {
      control: 'select',
      options: [
        '/games/123/lineup/home',
        '/games/123/lineup/away',
        '/games/123/roster',
        '/games/123/stats',
        '/games/123/substitutions',
      ],
    },
  },
};

export default meta;

export const HomeTeamSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/games/123/lineup/home',
  },
};

export const AwayTeamSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/games/123/lineup/away',
  },
};

export const RosterSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/games/123/roster',
  },
};

export const StatsSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/games/123/stats',
  },
};

export const SubstitutionsSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/games/123/substitutions',
  },
};

export const LongTeamNames = {
  args: {
    homeTeamName: 'Manchester United Football Club',
    awayTeamName: 'Chelsea Football Club',
    currentPath: '/games/123/lineup/home',
  },
};

export const ShortTeamNames = {
  args: {
    homeTeamName: 'PSG',
    awayTeamName: 'ACM',
    currentPath: '/games/123/stats',
  },
};

export const YouthMatch = {
  args: {
    homeTeamName: 'Barcelona Youth',
    awayTeamName: 'Madrid Academy',
    currentPath: '/games/123/roster',
  },
};

export const InternationalMatch = {
  args: {
    homeTeamName: 'Spain National Team',
    awayTeamName: 'Brazil National Team',
    currentPath: '/games/123/lineup/home',
  },
};

export const WomensMatch = {
  args: {
    homeTeamName: 'Barcelona Femení',
    awayTeamName: 'Chelsea Women',
    currentPath: '/games/123/substitutions',
  },
};
