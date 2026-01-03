import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlayerCard } from './player-card';

const meta: Meta<typeof PlayerCard> = {
  title: 'Components/PlayerCard',
  component: PlayerCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isOnField: {
      control: 'boolean',
    },
    showStatButtons: {
      control: 'boolean',
    },
    showPhase1Stats: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlayerCard>;

const defaultStats = {
  goals: 2,
  assists: 1,
  yellowCards: 0,
  redCards: 0,
  foulsCommitted: 1,
  foulsReceived: 2,
  shotsOnTarget: 4,
  shotsOffTarget: 2,
  saves: 0,
};

export const OnFieldWithPhoto: Story = {
  args: {
    id: '1',
    name: 'Lionel Messi',
    jersey: 10,
    position: 'Forward',
    playTime: 2700,
    isOnField: true,
    photo:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60',
    stats: defaultStats,
    showStatButtons: true,
    showPhase1Stats: false,
  },
};

export const OnBench: Story = {
  args: {
    id: '2',
    name: 'Cristiano Ronaldo',
    jersey: 7,
    position: 'Forward',
    playTime: 900,
    isOnField: false,
    stats: { ...defaultStats, goals: 1, assists: 0 },
    showStatButtons: true,
    showPhase1Stats: false,
  },
};

export const WithoutPhoto: Story = {
  args: {
    id: '3',
    name: 'Kevin De Bruyne',
    jersey: 17,
    position: 'Midfielder',
    playTime: 2400,
    isOnField: true,
    stats: { ...defaultStats, goals: 0, assists: 3 },
    showStatButtons: true,
    showPhase1Stats: false,
  },
};

export const Goalkeeper: Story = {
  args: {
    id: '4',
    name: 'Marc-André ter Stegen',
    jersey: 1,
    position: 'Goalkeeper',
    playTime: 5400,
    isOnField: true,
    photo:
      'https://images.unsplash.com/photo-1594736797933-d0b22d3694a9?w=400&auto=format&fit=crop&q=60',
    stats: { ...defaultStats, goals: 0, assists: 0, saves: 7 },
    showStatButtons: true,
    showPhase1Stats: true,
  },
};

export const WithPhase1Stats: Story = {
  args: {
    id: '5',
    name: 'Robert Lewandowski',
    jersey: 9,
    position: 'Forward',
    playTime: 3600,
    isOnField: true,
    stats: {
      goals: 2,
      assists: 1,
      yellowCards: 1,
      redCards: 0,
      foulsCommitted: 3,
      foulsReceived: 2,
      shotsOnTarget: 5,
      shotsOffTarget: 2,
      saves: 0,
    },
    showStatButtons: true,
    showPhase1Stats: true,
  },
};

export const NoStatButtons: Story = {
  args: {
    id: '6',
    name: 'Kylian Mbappé',
    jersey: 7,
    position: 'Forward',
    playTime: 4500,
    isOnField: true,
    stats: defaultStats,
    showStatButtons: false,
    showPhase1Stats: false,
  },
};
