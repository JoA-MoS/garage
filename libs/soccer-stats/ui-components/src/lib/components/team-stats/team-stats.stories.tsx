import type { Meta, StoryObj } from '@storybook/react-vite';

import { TeamStats } from './team-stats';

const meta: Meta<typeof TeamStats> = {
  component: TeamStats,
  title: 'Components/TeamStats',
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof TeamStats>;

export const Default: Story = {
  args: {
    teamName: 'Blue Thunder FC',
    playerCount: 18,
    gamesPlayed: 12,
    wins: 8,
    draws: 2,
    losses: 2,
    winRate: 67,
    goalsScored: 24,
    assists: 18,
    playTimeHours: 156,
    redCards: 1,
    activePlayerCount: 15,
    topScorerName: 'Marcus Johnson',
    topAssisterName: 'Alex Rivera',
    mostMinutesPlayerName: 'Sam Chen',
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    teamName: 'Blue Thunder FC',
    playerCount: 0,
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    goalsScored: 0,
    assists: 0,
    playTimeHours: 0,
    redCards: 0,
    activePlayerCount: 0,
    error: 'Failed to load team statistics. Please try again.',
  },
};

export const NewTeam: Story = {
  args: {
    teamName: 'New Team',
    playerCount: 5,
    gamesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    winRate: 0,
    goalsScored: 0,
    assists: 0,
    playTimeHours: 0,
    redCards: 0,
    activePlayerCount: 5,
  },
};

export const HighPerformance: Story = {
  args: {
    teamName: 'Champions United',
    playerCount: 22,
    gamesPlayed: 30,
    wins: 25,
    draws: 3,
    losses: 2,
    winRate: 83,
    goalsScored: 78,
    assists: 62,
    playTimeHours: 450,
    redCards: 3,
    activePlayerCount: 20,
    topScorerName: 'Elite Striker',
    topAssisterName: 'Playmaker Pro',
    mostMinutesPlayerName: 'Iron Man',
  },
};
