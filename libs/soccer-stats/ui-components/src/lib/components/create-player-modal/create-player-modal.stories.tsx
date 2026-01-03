import type { Meta, StoryObj } from '@storybook/react-vite';

import { CreatePlayerModal } from './create-player-modal';

const meta: Meta<typeof CreatePlayerModal> = {
  title: 'Components/CreatePlayerModal',
  component: CreatePlayerModal,
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
type Story = StoryObj<typeof CreatePlayerModal>;

export const Default: Story = {
  args: {
    loading: false,
    teamColor: '#3B82F6',
    onSubmit: async (data) => {
      console.log('Player data:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const BlueTeam: Story = {
  args: {
    loading: false,
    teamColor: '#3B82F6',
  },
};

export const RedTeam: Story = {
  args: {
    loading: false,
    teamColor: '#EF4444',
  },
};

export const GreenTeam: Story = {
  args: {
    loading: false,
    teamColor: '#22C55E',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    teamColor: '#3B82F6',
  },
};
