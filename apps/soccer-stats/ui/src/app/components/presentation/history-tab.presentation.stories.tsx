import { HistoryTabPresentation } from './history-tab.presentation';

const meta = {
  title: 'Components/Presentation/HistoryTab',
  component: HistoryTabPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onDeleteGame: { action: 'game deleted' },
    onExportGame: { action: 'game exported' },
    onExportSeason: { action: 'season exported' },
    onClearAllData: { action: 'all data cleared' },
  },
};

export default meta;

// Sample game history data
const sampleGameHistory = [
  {
    id: 'game-1',
    date: '2024-01-15T14:30:00.000Z',
    homeTeam: {
      name: 'Lightning Bolts',
      score: 3,
      players: [
        {
          id: 1,
          name: 'Alex Rodriguez',
          jersey: 10,
          position: 'Forward',
          playTime: 2700,
          goals: 2,
          assists: 1,
          photo:
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        },
        {
          id: 2,
          name: 'Maria Santos',
          jersey: 7,
          position: 'Midfielder',
          playTime: 2400,
          goals: 1,
          assists: 2,
        },
      ],
    },
    awayTeam: {
      name: 'Thunder Hawks',
      score: 2,
      players: [
        {
          id: 3,
          name: 'David Kim',
          jersey: 11,
          position: 'Forward',
          playTime: 2100,
          goals: 2,
          assists: 0,
        },
      ],
    },
    duration: 2700,
    goals: [
      {
        id: 'goal-1',
        timestamp: 600,
        team: 'home',
        scorerId: 1,
        scorerName: 'Alex Rodriguez',
        realTime: '2024-01-15T14:40:00.000Z',
      },
      {
        id: 'goal-2',
        timestamp: 1200,
        team: 'away',
        scorerId: 3,
        scorerName: 'David Kim',
        realTime: '2024-01-15T14:50:00.000Z',
      },
    ],
    substitutions: [],
  },
  {
    id: 'game-2',
    date: '2024-01-20T10:00:00.000Z',
    homeTeam: {
      name: 'Lightning Bolts',
      score: 1,
      players: [
        {
          id: 1,
          name: 'Alex Rodriguez',
          jersey: 10,
          position: 'Forward',
          playTime: 2000,
          goals: 1,
          assists: 0,
        },
      ],
    },
    awayTeam: {
      name: 'Storm Eagles',
      score: 1,
      players: [
        {
          id: 4,
          name: 'Sophie Chen',
          jersey: 8,
          position: 'Midfielder',
          playTime: 2700,
          goals: 1,
          assists: 0,
        },
      ],
    },
    duration: 2700,
    goals: [],
    substitutions: [],
  },
];

// Sample season stats
const sampleSeasonStats = [
  {
    playerId: 1,
    name: 'Alex Rodriguez',
    jersey: 10,
    position: 'Forward',
    gamesPlayed: 2,
    totalPlayTime: 4700,
    totalGoals: 3,
    totalAssists: 1,
    averagePlayTime: 2350,
    photo:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  },
  {
    playerId: 2,
    name: 'Maria Santos',
    jersey: 7,
    position: 'Midfielder',
    gamesPlayed: 1,
    totalPlayTime: 2400,
    totalGoals: 1,
    totalAssists: 2,
    averagePlayTime: 2400,
  },
  {
    playerId: 3,
    name: 'David Kim',
    jersey: 11,
    position: 'Forward',
    gamesPlayed: 1,
    totalPlayTime: 2100,
    totalGoals: 2,
    totalAssists: 0,
    averagePlayTime: 2100,
  },
];

const mockAnalytics = () => ({
  winLossRecord: { wins: 1, losses: 0, draws: 1 },
  averageScore: 2.5,
  topScorers: [
    { name: 'Alex Rodriguez', goals: 3 },
    { name: 'David Kim', goals: 2 },
    { name: 'Maria Santos', goals: 1 },
  ],
  topAssists: [
    { name: 'Maria Santos', assists: 2 },
    { name: 'Alex Rodriguez', assists: 1 },
  ],
});

export const WithGameHistory = {
  args: {
    gameHistory: sampleGameHistory,
    seasonStats: sampleSeasonStats,
    isLoading: false,
    getTeamAnalytics: mockAnalytics,
  },
};

export const EmptyHistory = {
  args: {
    gameHistory: [],
    seasonStats: [],
    isLoading: false,
    getTeamAnalytics: () => ({
      winLossRecord: { wins: 0, losses: 0, draws: 0 },
      averageScore: 0,
      topScorers: [],
      topAssists: [],
    }),
  },
};

export const Loading = {
  args: {
    gameHistory: [],
    seasonStats: [],
    isLoading: true,
    getTeamAnalytics: mockAnalytics,
  },
};
