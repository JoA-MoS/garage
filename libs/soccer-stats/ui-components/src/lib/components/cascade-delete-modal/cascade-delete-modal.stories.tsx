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
        gameMinute: 23,
        gameSecond: 45,
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
        gameMinute: 45,
        gameSecond: 0,
        playerName: 'Player A',
        description: 'Substitution out',
      },
      {
        id: '2',
        eventType: 'SUBSTITUTION_IN',
        gameMinute: 45,
        gameSecond: 0,
        playerName: 'Player B',
        description: 'Substitution in',
      },
      {
        id: '3',
        eventType: 'POSITION_SWAP',
        gameMinute: 46,
        gameSecond: 30,
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
        gameMinute: 23,
        gameSecond: 45,
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
