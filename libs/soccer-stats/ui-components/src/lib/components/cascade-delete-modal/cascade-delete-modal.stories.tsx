import type { Meta, StoryObj } from '@storybook/react-vite';

import { CascadeDeleteModal } from './cascade-delete-modal';

const meta: Meta<typeof CascadeDeleteModal> = {
  component: CascadeDeleteModal,
  title: 'Components/CascadeDeleteModal',
  tags: ['autodocs'],
  argTypes: {
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof CascadeDeleteModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    eventType: 'goal',
    dependentEvents: [
      {
        id: '1',
        eventType: 'ASSIST',
        periodSecond: 1425,
        playerName: 'John Doe',
        description: 'Assist for goal',
      },
    ],
    warningMessage: 'This action cannot be undone.',
    isDeleting: false,
  },
};

export const MultipleDependents: Story = {
  args: {
    isOpen: true,
    eventType: 'substitution',
    dependentEvents: [
      {
        id: '1',
        eventType: 'SUBSTITUTION_OUT',
        periodSecond: 2700,
        playerName: 'Player A',
        description: 'Substitution out',
      },
      {
        id: '2',
        eventType: 'SUBSTITUTION_IN',
        periodSecond: 2700,
        playerName: 'Player B',
        description: 'Substitution in',
      },
      {
        id: '3',
        eventType: 'POSITION_SWAP',
        periodSecond: 2790,
        playerName: 'Player C',
        description: 'Position swap after sub',
      },
    ],
    isDeleting: false,
  },
};

export const Deleting: Story = {
  args: {
    isOpen: true,
    eventType: 'goal',
    dependentEvents: [
      {
        id: '1',
        eventType: 'ASSIST',
        periodSecond: 1425,
        playerName: 'John Doe',
        description: 'Assist for goal',
      },
    ],
    isDeleting: true,
  },
};

export const NoDependents: Story = {
  args: {
    isOpen: true,
    eventType: 'position_swap',
    dependentEvents: [],
    warningMessage: 'Are you sure you want to delete this position swap?',
    isDeleting: false,
  },
};
