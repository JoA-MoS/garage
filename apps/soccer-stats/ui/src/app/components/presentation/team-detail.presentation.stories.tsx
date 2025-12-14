import { UITeam } from '../types/ui.types';

import { TeamDetailPresentation } from './team-detail.presentation';

const meta = {
  title: 'Components/Presentation/TeamDetail',
  component: TeamDetailPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onEdit: { action: 'edit clicked' },
    onBack: { action: 'back clicked' },
  },
};

export default meta;

// Sample teams with different characteristics
const barcelonaTeam: UITeam = {
  id: '1',
  name: 'FC Barcelona',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  playerCount: 25,
  createdAt: '2024-01-15',
};

const realMadridTeam: UITeam = {
  id: '2',
  name: 'Real Madrid',
  primaryColor: '#FFFFFF',
  secondaryColor: '#FFD700',
  logo: 'https://images.unsplash.com/photo-1582142306909-195724d33d6c?w=100&auto=format&fit=crop&q=60',
  playerCount: 28,
  createdAt: '2024-01-20',
};

const manchesterCityTeam: UITeam = {
  id: '3',
  name: 'Manchester City',
  primaryColor: '#6CABDD',
  secondaryColor: '#FFFFFF',
  logo: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=60',
  playerCount: 22,
  createdAt: '2024-02-01',
};

const liverpoolTeam: UITeam = {
  id: '4',
  name: 'Liverpool FC',
  primaryColor: '#C8102E',
  secondaryColor: '#F6EB61',
  logo: 'https://images.unsplash.com/photo-1508768787810-6adc1f613514?w=100&auto=format&fit=crop&q=60',
  playerCount: 30,
  createdAt: '2024-02-10',
};

const youthTeam: UITeam = {
  id: '5',
  name: 'Barcelona Youth Academy U16',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  playerCount: 18,
  createdAt: '2024-01-15',
};

const womensTeam: UITeam = {
  id: '6',
  name: 'Barcelona Femení',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  playerCount: 23,
  createdAt: '2024-01-15',
};

const teamWithoutLogo: UITeam = {
  id: '7',
  name: 'Local Community FC',
  primaryColor: '#3B82F6',
  secondaryColor: '#FFFFFF',
  playerCount: 20,
  createdAt: '2024-02-15',
};

const newTeamWithoutPlayers: UITeam = {
  id: '8',
  name: 'New Team FC',
  primaryColor: '#10B981',
  secondaryColor: '#FFFFFF',
  playerCount: 0,
  createdAt: new Date().toISOString(),
};

const teamWithLongName: UITeam = {
  id: '9',
  name: 'Manchester United Football Club Academy Youth Development',
  primaryColor: '#E60026',
  secondaryColor: '#FFD700',
  playerCount: 15,
  createdAt: '2024-02-20',
};

const customColorTeam: UITeam = {
  id: '10',
  name: 'Forest Green Rovers',
  primaryColor: '#228B22',
  secondaryColor: '#FFFFFF',
  playerCount: 22,
  createdAt: '2024-02-25',
};

export const Barcelona = {
  args: {
    team: barcelonaTeam,
  },
};

export const RealMadrid = {
  args: {
    team: realMadridTeam,
  },
};

export const ManchesterCity = {
  args: {
    team: manchesterCityTeam,
  },
};

export const Liverpool = {
  args: {
    team: liverpoolTeam,
  },
};

export const YouthTeam = {
  args: {
    team: youthTeam,
  },
};

export const WomensTeam = {
  args: {
    team: womensTeam,
  },
};

export const TeamWithoutLogo = {
  args: {
    team: teamWithoutLogo,
  },
};

export const NewTeamWithoutPlayers = {
  args: {
    team: newTeamWithoutPlayers,
  },
};

export const TeamWithLongName = {
  args: {
    team: teamWithLongName,
  },
};

export const CustomColorTeam = {
  args: {
    team: customColorTeam,
  },
};

export const LowPlayerCount = {
  args: {
    team: {
      ...barcelonaTeam,
      playerCount: 5,
      name: 'Small Squad FC',
    },
  },
};

export const HighPlayerCount = {
  args: {
    team: {
      ...liverpoolTeam,
      playerCount: 45,
      name: 'Large Squad United',
    },
  },
};

export const RecentlyCreatedTeam = {
  args: {
    team: {
      ...newTeamWithoutPlayers,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
  },
};

export const OldTeam = {
  args: {
    team: {
      ...barcelonaTeam,
      createdAt: '2020-01-01',
      name: 'Legacy FC',
    },
  },
};
