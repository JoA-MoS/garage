import { GameNavigationPresentation } from './game-navigation.presentation';

const meta = {
  title: 'Components/Presentation/GameNavigation',
  component: GameNavigationPresentation,
  parameters: {
    layout: 'padded',
    // Mock React Router for stories
    reactRouter: {
      routePath: '/game/:gameId/*',
      routeParams: { gameId: '123' },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentPath: {
      control: 'select',
      options: [
        '/game/123/lineup/home',
        '/game/123/lineup/away',
        '/game/123/roster',
        '/game/123/stats',
        '/game/123/substitutions',
      ],
    },
  },
};

export default meta;

export const HomeTeamSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/game/123/lineup/home',
  },
};

export const AwayTeamSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/game/123/lineup/away',
  },
};

export const RosterSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/game/123/roster',
  },
};

export const StatsSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/game/123/stats',
  },
};

export const SubstitutionsSelected = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    currentPath: '/game/123/substitutions',
  },
};

export const LongTeamNames = {
  args: {
    homeTeamName: 'Manchester United Football Club',
    awayTeamName: 'Chelsea Football Club',
    currentPath: '/game/123/lineup/home',
  },
};

export const ShortTeamNames = {
  args: {
    homeTeamName: 'PSG',
    awayTeamName: 'ACM',
    currentPath: '/game/123/stats',
  },
};

export const YouthMatch = {
  args: {
    homeTeamName: 'Barcelona Youth',
    awayTeamName: 'Madrid Academy',
    currentPath: '/game/123/roster',
  },
};

export const InternationalMatch = {
  args: {
    homeTeamName: 'Spain National Team',
    awayTeamName: 'Brazil National Team',
    currentPath: '/game/123/lineup/home',
  },
};

export const WomensMatch = {
  args: {
    homeTeamName: 'Barcelona Femení',
    awayTeamName: 'Chelsea Women',
    currentPath: '/game/123/substitutions',
  },
};
