import type { Meta, StoryObj } from '@storybook/react-vite';

import { GameOverview } from './game-overview';

const meta: Meta<typeof GameOverview> = {
  component: GameOverview,
  title: 'Components/GameOverview',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GameOverview>;

export const Default: Story = {
  args: {
    totalGoals: 4,
    totalAssists: 3,
    gameTime: 2400, // 40:00
    assistRate: 75,
  },
};

export const HighScoring: Story = {
  args: {
    totalGoals: 12,
    totalAssists: 10,
    gameTime: 3600, // 60:00
    assistRate: 83,
  },
};

export const LowScoring: Story = {
  args: {
    totalGoals: 1,
    totalAssists: 0,
    gameTime: 1800, // 30:00
    assistRate: 0,
  },
};

export const EarlyGame: Story = {
  args: {
    totalGoals: 0,
    totalAssists: 0,
    gameTime: 300, // 5:00
    assistRate: 0,
  },
};

export const FullGame: Story = {
  args: {
    totalGoals: 6,
    totalAssists: 4,
    gameTime: 4800, // 80:00
    assistRate: 67,
  },
};
