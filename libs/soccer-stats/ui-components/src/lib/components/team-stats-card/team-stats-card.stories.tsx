import type { Meta, StoryObj } from '@storybook/react-vite';

import { TeamStatsCard } from './team-stats-card';

const meta: Meta<typeof TeamStatsCard> = {
  component: TeamStatsCard,
  title: 'Components/TeamStatsCard',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TeamStatsCard>;

export const HomeTeam: Story = {
  args: {
    team: {
      id: '1',
      name: 'FC United',
    },
    teamType: 'home',
    goals: 3,
    assists: 2,
    playersOnField: 5,
  },
};

export const AwayTeam: Story = {
  args: {
    team: {
      id: '2',
      name: 'City Rovers',
    },
    teamType: 'away',
    goals: 1,
    assists: 1,
    playersOnField: 5,
  },
};

export const NoGoals: Story = {
  args: {
    team: {
      id: '3',
      name: 'New Team FC',
    },
    teamType: 'home',
    goals: 0,
    assists: 0,
    playersOnField: 4,
  },
};

export const HighScoring: Story = {
  args: {
    team: {
      id: '4',
      name: 'Goal Machine United',
    },
    teamType: 'away',
    goals: 8,
    assists: 6,
    playersOnField: 5,
  },
};
