import { PlayerCard } from './PlayerCard';

const meta = {
  title: 'Components/PlayerCard',
  component: PlayerCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onStatUpdate: { action: 'stat updated' },
  },
};

export default meta;

// Sample player data
const samplePlayer = {
  id: 1,
  name: 'Lionel Messi',
  jersey: 10,
  position: 'Forward',
  depthRank: 1,
  playTime: 2700, // 45 minutes
  isOnField: true,
  team: 'home' as const,
};

// Sample team data with goals
const sampleTeam = {
  name: 'Home Team',
  players: [samplePlayer],
  goals: [
    {
      id: 'goal1',
      timestamp: 1200,
      scorerId: 1,
      assistId: 2,
      realTime: '2025-08-25T10:30:00Z',
    },
    {
      id: 'goal2',
      timestamp: 2400,
      scorerId: 1,
      realTime: '2025-08-25T10:45:00Z',
    },
  ],
};

const benchPlayer = {
  id: 2,
  name: 'Cristiano Ronaldo',
  jersey: 7,
  position: 'Forward',
  depthRank: 2,
  playTime: 900, // 15 minutes
  isOnField: false,
  team: 'away' as const,
};

const awayTeam = {
  name: 'Away Team',
  players: [benchPlayer],
  goals: [
    {
      id: 'goal3',
      timestamp: 1800,
      scorerId: 2,
      realTime: '2025-08-25T10:35:00Z',
    },
  ],
};

export const OnField = {
  args: {
    player: samplePlayer,
    team: sampleTeam,
    isOnField: true,
    onStatUpdate: (playerId, stat) => {
      console.log(`Player ${playerId} ${stat} updated`);
    },
  },
};

export const OnBench = {
  args: {
    player: benchPlayer,
    team: awayTeam,
    isOnField: false,
  },
};

export const WithoutStatButtons = {
  args: {
    player: samplePlayer,
    team: sampleTeam,
    isOnField: true,
    // No onStatUpdate prop to hide buttons
  },
};

export const Goalkeeper = {
  args: {
    player: {
      ...samplePlayer,
      name: 'Marc-André ter Stegen',
      jersey: 1,
      position: 'Goalkeeper',
    },
    team: {
      ...sampleTeam,
      goals: [], // Goalkeeper has no goals
    },
    isOnField: true,
    onStatUpdate: (playerId, stat) => {
      console.log(`Player ${playerId} ${stat} updated`);
    },
  },
};
