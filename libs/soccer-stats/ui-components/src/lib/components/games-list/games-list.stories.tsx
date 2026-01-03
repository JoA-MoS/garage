import type { Meta, StoryObj } from '@storybook/react-vite';

import type { GamePresentationData } from './games-list';
import { GamesList } from './games-list';

const meta: Meta<typeof GamesList> = {
  component: GamesList,
  title: 'Components/GamesList',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof GamesList>;

const sampleGames: GamePresentationData[] = [
  {
    id: '1',
    name: 'Championship Final',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    venue: 'Main Stadium',
    status: 'SCHEDULED',
    homeTeam: { id: 'h1', name: 'Barcelona FC' },
    awayTeam: { id: 'a1', name: 'Real Madrid' },
    gameFormatName: '11v11 Full Game',
  },
  {
    id: '2',
    name: 'League Match Week 15',
    scheduledStart: new Date().toISOString(), // Today
    venue: 'Camp Nou',
    status: 'IN_PROGRESS',
    homeTeam: { id: 'h2', name: 'Barcelona FC' },
    awayTeam: { id: 'a2', name: 'Atletico Madrid' },
    homeScore: 2,
    awayScore: 1,
    gameFormatName: '11v11 Full Game',
  },
  {
    id: '3',
    name: 'Friendly Match',
    scheduledStart: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    venue: 'Training Ground',
    status: 'COMPLETED',
    homeTeam: { id: 'h3', name: 'Barcelona B' },
    awayTeam: { id: 'a3', name: 'Girona FC' },
    homeScore: 3,
    awayScore: 3,
    gameFormatName: '7v7 Youth',
  },
  {
    id: '4',
    name: 'Cup Quarter Final',
    scheduledStart: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    status: 'CANCELLED',
    homeTeam: { id: 'h4', name: 'Valencia CF' },
    awayTeam: { id: 'a4', name: 'Sevilla FC' },
    gameFormatName: '11v11 Full Game',
  },
];

export const Default: Story = {
  args: {
    games: sampleGames,
  },
};

export const Loading: Story = {
  args: {
    games: [],
    loading: true,
  },
};

export const Error: Story = {
  args: {
    games: [],
    error:
      'Failed to load games. Please check your network connection and try again.',
  },
};

export const Empty: Story = {
  args: {
    games: [],
  },
};

export const SingleGame: Story = {
  args: {
    games: [sampleGames[0]],
  },
};

export const ManyGames: Story = {
  args: {
    games: [
      ...sampleGames,
      {
        id: '5',
        name: 'Youth Tournament Game 1',
        scheduledStart: new Date(Date.now() + 172800000).toISOString(),
        venue: 'Youth Field A',
        status: 'SCHEDULED',
        homeTeam: { id: 'h5', name: 'Barcelona U12' },
        awayTeam: { id: 'a5', name: 'Espanyol U12' },
        gameFormatName: '7v7 Youth',
      },
      {
        id: '6',
        name: 'Youth Tournament Game 2',
        scheduledStart: new Date(Date.now() + 259200000).toISOString(),
        venue: 'Youth Field B',
        status: 'SCHEDULED',
        homeTeam: { id: 'h6', name: 'Barcelona U14' },
        awayTeam: { id: 'a6', name: 'Real Sociedad U14' },
        gameFormatName: '9v9 Youth',
      },
    ],
  },
};
