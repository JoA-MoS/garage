import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UITeam } from '../../types';

import { TeamsList } from './teams-list';

const meta: Meta<typeof TeamsList> = {
  title: 'Components/TeamsList',
  component: TeamsList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TeamsList>;

const sampleTeams: UITeam[] = [
  {
    id: '1',
    name: 'Barcelona FC',
    homePrimaryColor: '#004D98',
    homeSecondaryColor: '#A50044',
    playerCount: 23,
    isActive: true,
    isManaged: true,
    sourceType: 'INTERNAL',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Real Madrid',
    homePrimaryColor: '#FFFFFF',
    homeSecondaryColor: '#FFD700',
    playerCount: 25,
    isActive: true,
    isManaged: true,
    sourceType: 'INTERNAL',
    createdAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '3',
    name: 'Manchester United',
    homePrimaryColor: '#DA291C',
    homeSecondaryColor: '#FBE122',
    playerCount: 22,
    isActive: true,
    isManaged: true,
    sourceType: 'INTERNAL',
    createdAt: '2024-02-15T09:00:00Z',
  },
  {
    id: '4',
    name: 'Bayern Munich',
    homePrimaryColor: '#DC052D',
    homeSecondaryColor: '#FFFFFF',
    playerCount: 24,
    isActive: true,
    isManaged: true,
    sourceType: 'INTERNAL',
    createdAt: '2024-03-01T11:00:00Z',
  },
];

export const WithTeams: Story = {
  args: {
    teams: sampleTeams,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    teams: [],
    loading: true,
  },
};

export const EmptyState: Story = {
  args: {
    teams: [],
    loading: false,
  },
};

export const WithError: Story = {
  args: {
    teams: [],
    loading: false,
    error:
      'Failed to connect to the server. Please check your internet connection and try again.',
  },
};

export const SingleTeam: Story = {
  args: {
    teams: [sampleTeams[0]],
    loading: false,
  },
};

export const ManyTeams: Story = {
  args: {
    teams: [
      ...sampleTeams,
      {
        id: '5',
        name: 'Paris Saint-Germain',
        homePrimaryColor: '#004170',
        homeSecondaryColor: '#DA291C',
        playerCount: 26,
        isActive: true,
        isManaged: true,
        sourceType: 'INTERNAL',
        createdAt: '2024-03-15T08:00:00Z',
      },
      {
        id: '6',
        name: 'Juventus',
        homePrimaryColor: '#000000',
        homeSecondaryColor: '#FFFFFF',
        playerCount: 21,
        isActive: true,
        isManaged: true,
        sourceType: 'INTERNAL',
        createdAt: '2024-03-20T16:00:00Z',
      },
    ],
    loading: false,
  },
};
