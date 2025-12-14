import { UITeam } from '../types/ui.types';

import { TeamsListPresentation } from './teams-list.presentation';

const meta = {
  title: 'Components/Presentation/TeamsList',
  component: TeamsListPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onCreateTeam: { action: 'create team clicked' },
    onEditTeam: { action: 'edit team clicked' },
    onViewTeam: { action: 'view team clicked' },
  },
};

export default meta;

// Sample teams data
const sampleTeams: UITeam[] = [
  {
    id: '1',
    name: 'FC Barcelona',
    primaryColor: '#004D98',
    secondaryColor: '#A50044',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
    playerCount: 25,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Real Madrid',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFD700',
    logo: 'https://images.unsplash.com/photo-1582142306909-195724d33d6c?w=100&auto=format&fit=crop&q=60',
    playerCount: 28,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Manchester City',
    primaryColor: '#6CABDD',
    secondaryColor: '#FFFFFF',
    logo: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=60',
    playerCount: 22,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Liverpool FC',
    primaryColor: '#C8102E',
    secondaryColor: '#F6EB61',
    logo: 'https://images.unsplash.com/photo-1508768787810-6adc1f613514?w=100&auto=format&fit=crop&q=60',
    playerCount: 30,
    createdAt: '2024-02-10',
  },
];

const youthTeams: UITeam[] = [
  {
    id: '1',
    name: 'Barcelona Youth Academy U16',
    primaryColor: '#004D98',
    secondaryColor: '#A50044',
    playerCount: 18,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Madrid Academy U16',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFD700',
    playerCount: 16,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'City Youth U16',
    primaryColor: '#6CABDD',
    secondaryColor: '#FFFFFF',
    playerCount: 20,
    createdAt: '2024-02-01',
  },
];

const womensTeams: UITeam[] = [
  {
    id: '1',
    name: 'Barcelona Femení',
    primaryColor: '#004D98',
    secondaryColor: '#A50044',
    logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
    playerCount: 23,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Chelsea Women',
    primaryColor: '#034694',
    secondaryColor: '#FFFFFF',
    logo: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=60',
    playerCount: 25,
    createdAt: '2024-01-20',
  },
];

export const Default = {
  args: {
    teams: sampleTeams,
  },
};

export const EmptyState = {
  args: {
    teams: [],
  },
};

export const SingleTeam = {
  args: {
    teams: [sampleTeams[0]],
  },
};

export const YouthTeams = {
  args: {
    teams: youthTeams,
  },
};

export const WomensTeams = {
  args: {
    teams: womensTeams,
  },
};

export const TeamsWithoutLogos = {
  args: {
    teams: sampleTeams.map((team) => ({
      ...team,
      logo: undefined,
    })),
  },
};

export const ManyTeams = {
  args: {
    teams: [
      ...sampleTeams,
      {
        id: '5',
        name: 'Paris Saint-Germain',
        primaryColor: '#004170',
        secondaryColor: '#ED1A3B',
        playerCount: 26,
        createdAt: '2024-02-15',
      },
      {
        id: '6',
        name: 'Bayern Munich',
        primaryColor: '#DC052D',
        secondaryColor: '#FFFFFF',
        playerCount: 24,
        createdAt: '2024-02-20',
      },
      {
        id: '7',
        name: 'Juventus',
        primaryColor: '#000000',
        secondaryColor: '#FFFFFF',
        playerCount: 27,
        createdAt: '2024-02-25',
      },
      {
        id: '8',
        name: 'AC Milan',
        primaryColor: '#AC1A2F',
        secondaryColor: '#000000',
        playerCount: 29,
        createdAt: '2024-03-01',
      },
    ],
  },
};

export const TeamsWithLowPlayerCount = {
  args: {
    teams: [
      {
        id: '1',
        name: 'New Team',
        primaryColor: '#3B82F6',
        secondaryColor: '#FFFFFF',
        playerCount: 5,
        createdAt: '2024-03-01',
      },
      {
        id: '2',
        name: 'Another New Team',
        primaryColor: '#10B981',
        secondaryColor: '#FFFFFF',
        playerCount: 8,
        createdAt: '2024-03-05',
      },
    ],
  },
};
