import type { Meta, StoryObj } from '@storybook/react-vite';

import { GameHeader } from './game-header';

const meta: Meta<typeof GameHeader> = {
  title: 'Components/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GameHeader>;

export const GameNotStarted: Story = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    homeScore: 0,
    awayScore: 0,
    gameTime: 0,
    isGameRunning: false,
  },
};

export const GameInProgress: Story = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    homeScore: 2,
    awayScore: 1,
    gameTime: 1800, // 30 minutes
    isGameRunning: true,
  },
};

export const GamePaused: Story = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    homeScore: 3,
    awayScore: 2,
    gameTime: 2700, // 45 minutes (halftime)
    isGameRunning: false,
  },
};

export const HighScoring: Story = {
  args: {
    homeTeamName: 'Manchester City',
    awayTeamName: 'Liverpool',
    homeScore: 5,
    awayScore: 4,
    gameTime: 5100, // 85 minutes
    isGameRunning: true,
  },
};

export const LongTeamNames: Story = {
  args: {
    homeTeamName: 'Wolverhampton Wanderers',
    awayTeamName: 'Sheffield Wednesday',
    homeScore: 1,
    awayScore: 0,
    gameTime: 3600,
    isGameRunning: true,
  },
};
