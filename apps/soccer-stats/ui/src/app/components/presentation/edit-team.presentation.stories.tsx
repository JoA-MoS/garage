import { UITeam } from '../types/ui.types';

import { EditTeamPresentation } from './edit-team.presentation';

const meta = {
  title: 'Components/Presentation/EditTeam',
  component: EditTeamPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'team updated' },
    onCancel: { action: 'cancel clicked' },
    loading: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample team data for editing
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

const youthTeam: UITeam = {
  id: '4',
  name: 'Barcelona Youth Academy U16',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  playerCount: 18,
  createdAt: '2024-01-15',
};

const womensTeam: UITeam = {
  id: '5',
  name: 'Barcelona Femení',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  playerCount: 23,
  createdAt: '2024-01-15',
};

const teamWithoutLogo: UITeam = {
  id: '6',
  name: 'Local Community FC',
  primaryColor: '#3B82F6',
  secondaryColor: '#FFFFFF',
  playerCount: 20,
  createdAt: '2024-02-15',
};

export const EditBarcelona = {
  args: {
    initialTeamData: barcelonaTeam,
    loading: false,
  },
};

export const EditRealMadrid = {
  args: {
    initialTeamData: realMadridTeam,
    loading: false,
  },
};

export const EditManchesterCity = {
  args: {
    initialTeamData: manchesterCityTeam,
    loading: false,
  },
};

export const EditYouthTeam = {
  args: {
    initialTeamData: youthTeam,
    loading: false,
  },
};

export const EditWomensTeam = {
  args: {
    initialTeamData: womensTeam,
    loading: false,
  },
};

export const EditTeamWithoutLogo = {
  args: {
    initialTeamData: teamWithoutLogo,
    loading: false,
  },
};

export const Loading = {
  args: {
    initialTeamData: barcelonaTeam,
    loading: true,
  },
};

export const WithError = {
  args: {
    initialTeamData: barcelonaTeam,
    loading: false,
    error: 'Failed to update team. A team with this name already exists.',
  },
};

export const NetworkError = {
  args: {
    initialTeamData: realMadridTeam,
    loading: false,
    error:
      'Network error occurred. Please check your connection and try again.',
  },
};

export const ValidationError = {
  args: {
    initialTeamData: manchesterCityTeam,
    loading: false,
    error: 'Team name is required and must be at least 2 characters long.',
  },
};

export const EditTeamWithLongName = {
  args: {
    initialTeamData: {
      ...barcelonaTeam,
      name: 'FC Barcelona Football Club International Academy',
    },
    loading: false,
  },
};

export const EditTeamWithCustomColors = {
  args: {
    initialTeamData: {
      ...teamWithoutLogo,
      name: 'Forest Green Rovers',
      primaryColor: '#228B22',
      secondaryColor: '#FFFFFF',
    },
    loading: false,
  },
};

export const EditNewlyCreatedTeam = {
  args: {
    initialTeamData: {
      id: '7',
      name: 'New Team FC',
      primaryColor: '#3B82F6',
      secondaryColor: '#FFFFFF',
      playerCount: 0,
      createdAt: new Date().toISOString(),
    },
    loading: false,
  },
};
