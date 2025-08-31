import { GameOverviewPresentation } from './game-overview.presentation';

const meta = {
  title: 'Components/Presentation/GameOverview',
  component: GameOverviewPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    totalGoals: {
      control: { type: 'number', min: 0, max: 20 },
    },
    totalAssists: {
      control: { type: 'number', min: 0, max: 15 },
    },
    gameTime: {
      control: { type: 'number', min: 0, max: 7200 }, // 0 to 120 minutes
    },
    assistRate: {
      control: { type: 'number', min: 0, max: 100 },
    },
  },
};

export default meta;

export const ActiveGame = {
  args: {
    totalGoals: 5,
    totalAssists: 4,
    gameTime: 4500, // 75 minutes
    assistRate: 80,
  },
};

export const HighScoringGame = {
  args: {
    totalGoals: 8,
    totalAssists: 6,
    gameTime: 5400, // 90 minutes
    assistRate: 75,
  },
};

export const LowScoringGame = {
  args: {
    totalGoals: 1,
    totalAssists: 1,
    gameTime: 3600, // 60 minutes
    assistRate: 100,
  },
};

export const ScorelessGame = {
  args: {
    totalGoals: 0,
    totalAssists: 0,
    gameTime: 5400, // 90 minutes
    assistRate: 0,
  },
};

export const EarlyGame = {
  args: {
    totalGoals: 2,
    totalAssists: 1,
    gameTime: 1800, // 30 minutes
    assistRate: 50,
  },
};

export const Overtime = {
  args: {
    totalGoals: 3,
    totalAssists: 2,
    gameTime: 6600, // 110 minutes (90 + 20 extra time)
    assistRate: 67,
  },
};

export const ManyAssists = {
  args: {
    totalGoals: 4,
    totalAssists: 7,
    gameTime: 4800, // 80 minutes
    assistRate: 175, // More assists than goals (multiple assists per goal)
  },
};
