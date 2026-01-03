import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConflictResolutionModal } from './conflict-resolution-modal';

const meta: Meta<typeof ConflictResolutionModal> = {
  component: ConflictResolutionModal,
  title: 'Components/ConflictResolutionModal',
  tags: ['autodocs'],
  argTypes: {
    onResolve: { action: 'resolved' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof ConflictResolutionModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    conflictId: 'conflict-1',
    eventType: 'GOAL',
    gameMinute: 23,
    gameSecond: 45,
    conflictingEvents: [
      {
        eventId: 'event-1',
        playerName: 'John Smith',
        playerId: 'player-1',
        recordedByUserName: 'Coach A',
      },
      {
        eventId: 'event-2',
        playerName: 'Jane Doe',
        playerId: 'player-2',
        recordedByUserName: 'Coach B',
      },
    ],
    isResolving: false,
  },
};

export const Substitution: Story = {
  args: {
    isOpen: true,
    conflictId: 'conflict-2',
    eventType: 'SUBSTITUTION',
    gameMinute: 45,
    gameSecond: 0,
    conflictingEvents: [
      {
        eventId: 'event-3',
        playerName: 'Player A',
        playerId: 'player-3',
        recordedByUserName: 'Assistant Coach',
      },
      {
        eventId: 'event-4',
        playerName: 'Player B',
        playerId: 'player-4',
        recordedByUserName: 'Team Manager',
      },
    ],
    isResolving: false,
  },
};

export const Resolving: Story = {
  args: {
    isOpen: true,
    conflictId: 'conflict-3',
    eventType: 'GOAL',
    gameMinute: 67,
    gameSecond: 30,
    conflictingEvents: [
      {
        eventId: 'event-5',
        playerName: 'Star Player',
        playerId: 'player-5',
        recordedByUserName: 'Head Coach',
      },
      {
        eventId: 'event-6',
        playerName: 'Backup Player',
        playerId: 'player-6',
        recordedByUserName: 'Parent Volunteer',
      },
    ],
    isResolving: true,
  },
};

export const MultipleConflicts: Story = {
  args: {
    isOpen: true,
    conflictId: 'conflict-4',
    eventType: 'POSITION_SWAP',
    gameMinute: 55,
    gameSecond: 15,
    conflictingEvents: [
      {
        eventId: 'event-7',
        playerName: 'Player X',
        playerId: 'player-7',
        recordedByUserName: 'User 1',
      },
      {
        eventId: 'event-8',
        playerName: 'Player Y',
        playerId: 'player-8',
        recordedByUserName: 'User 2',
      },
      {
        eventId: 'event-9',
        playerName: 'Player Z',
        playerId: 'player-9',
        recordedByUserName: 'User 3',
      },
    ],
    isResolving: false,
  },
};
