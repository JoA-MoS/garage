import { UITeam } from '../types/ui.types';

import { CreateTeamPresentation } from './create-team.presentation';

const meta = {
  title: 'Components/Presentation/CreateTeam',
  component: CreateTeamPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'team submitted' },
    onCancel: { action: 'cancel clicked' },
    onNext: { action: 'next clicked' },
    loading: {
      control: 'boolean',
    },
    isTabMode: {
      control: 'boolean',
    },
  },
};

export default meta;

export const Default = {
  args: {
    loading: false,
    isTabMode: false,
  },
};

export const Loading = {
  args: {
    loading: true,
    isTabMode: false,
  },
};

export const WithError = {
  args: {
    loading: false,
    error: 'Failed to create team. A team with this name already exists.',
    isTabMode: false,
  },
};

export const TabMode = {
  args: {
    loading: false,
    isTabMode: true,
  },
};

export const EditingExistingTeam = {
  args: {
    loading: false,
    initialData: {
      id: '1',
      name: 'FC Barcelona',
      primaryColor: '#004D98',
      secondaryColor: '#A50044',
      logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
      playerCount: 25,
      createdAt: '2024-01-15',
    } as UITeam,
    isTabMode: false,
  },
};

export const YouthTeamPreset = {
  args: {
    loading: false,
    initialData: {
      id: '2',
      name: 'Barcelona Youth Academy U16',
      primaryColor: '#004D98',
      secondaryColor: '#A50044',
      playerCount: 18,
      createdAt: '2024-01-15',
    } as UITeam,
    isTabMode: false,
  },
};

export const WomensTeamPreset = {
  args: {
    loading: false,
    initialData: {
      id: '3',
      name: 'Barcelona Femení',
      primaryColor: '#004D98',
      secondaryColor: '#A50044',
      logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
      playerCount: 23,
      createdAt: '2024-01-15',
    } as UITeam,
    isTabMode: false,
  },
};

export const CustomColorsPreset = {
  args: {
    loading: false,
    initialData: {
      id: '4',
      name: 'Manchester City',
      primaryColor: '#6CABDD',
      secondaryColor: '#FFFFFF',
      logo: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=100&auto=format&fit=crop&q=60',
      playerCount: 22,
      createdAt: '2024-02-01',
    } as UITeam,
    isTabMode: false,
  },
};

export const GreenTeamColors = {
  args: {
    loading: false,
    initialData: {
      id: '5',
      name: 'Forest Green Rovers',
      primaryColor: '#228B22',
      secondaryColor: '#FFFFFF',
      playerCount: 20,
      createdAt: '2024-02-01',
    } as UITeam,
    isTabMode: false,
  },
};

export const RedTeamColors = {
  args: {
    loading: false,
    initialData: {
      id: '6',
      name: 'Liverpool FC',
      primaryColor: '#C8102E',
      secondaryColor: '#F6EB61',
      logo: 'https://images.unsplash.com/photo-1508768787810-6adc1f613514?w=100&auto=format&fit=crop&q=60',
      playerCount: 30,
      createdAt: '2024-02-10',
    } as UITeam,
    isTabMode: false,
  },
};

export const TabModeWithData = {
  args: {
    loading: false,
    initialData: {
      id: '7',
      name: 'Real Madrid',
      primaryColor: '#FFFFFF',
      secondaryColor: '#FFD700',
      logo: 'https://images.unsplash.com/photo-1582142306909-195724d33d6c?w=100&auto=format&fit=crop&q=60',
      playerCount: 28,
      createdAt: '2024-01-20',
    } as UITeam,
    isTabMode: true,
  },
};

export const LoadingInTabMode = {
  args: {
    loading: true,
    isTabMode: true,
  },
};

export const ErrorInTabMode = {
  args: {
    loading: false,
    error:
      'Network error occurred. Please check your connection and try again.',
    isTabMode: true,
  },
};
