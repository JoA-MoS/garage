import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditPlayerModal, type EditPlayerData } from './edit-player-modal';

const mockPlayer: EditPlayerData = {
  id: '1',
  jerseyNumber: '10',
  primaryPosition: 'Midfielder',
  isActive: true,
  joinedDate: '2024-01-15',
  leftDate: null,
  user: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
  },
};

const meta: Meta<typeof EditPlayerModal> = {
  title: 'UI Components/EditPlayerModal',
  component: EditPlayerModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: {
      action: 'close',
      description: 'Callback when modal is closed',
    },
    onSubmit: {
      action: 'submit',
      description: 'Callback when form is submitted',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the form submission is in progress',
    },
    teamColor: {
      control: 'color',
      description: 'Team color for jersey preview',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditPlayerModal>;

export const Default: Story = {
  args: {
    player: mockPlayer,
    loading: false,
    teamColor: '#3B82F6',
    onSubmit: async (data) => {
      console.log('Update data:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ActivePlayer: Story = {
  args: {
    player: mockPlayer,
    loading: false,
    teamColor: '#3B82F6',
  },
};

export const InactivePlayer: Story = {
  args: {
    player: {
      ...mockPlayer,
      isActive: false,
      leftDate: '2024-06-30',
    },
    loading: false,
    teamColor: '#3B82F6',
  },
};

export const GoalkeeperPlayer: Story = {
  args: {
    player: {
      ...mockPlayer,
      jerseyNumber: '1',
      primaryPosition: 'Goalkeeper',
    },
    loading: false,
    teamColor: '#22C55E',
  },
};

export const StrikerPlayer: Story = {
  args: {
    player: {
      ...mockPlayer,
      jerseyNumber: '9',
      primaryPosition: 'Striker',
    },
    loading: false,
    teamColor: '#EF4444',
  },
};

export const MinimalData: Story = {
  args: {
    player: {
      id: '2',
      jerseyNumber: null,
      primaryPosition: null,
      isActive: true,
      joinedDate: null,
      leftDate: null,
      user: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: null,
        phone: null,
      },
    },
    loading: false,
    teamColor: '#8B5CF6',
  },
};

export const Loading: Story = {
  args: {
    player: mockPlayer,
    loading: true,
    teamColor: '#3B82F6',
  },
};
