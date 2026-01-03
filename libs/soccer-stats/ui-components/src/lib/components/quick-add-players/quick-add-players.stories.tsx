import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UIPlayer } from '../../types';

import { QuickAddPlayers } from './quick-add-players';

const meta: Meta<typeof QuickAddPlayers> = {
  component: QuickAddPlayers,
  title: 'Components/QuickAddPlayers',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onPlayerSelection: { action: 'player-selection' },
    onJerseyChange: { action: 'jersey-change' },
    onAddPlayers: { action: 'add-players' },
    onClose: { action: 'close' },
  },
};

export default meta;
type Story = StoryObj<typeof QuickAddPlayers>;

const mockPlayers: UIPlayer[] = [
  {
    id: '1',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus@example.com',
    isActive: true,
    position: 'Forward',
  },
  {
    id: '2',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex@example.com',
    isActive: true,
    position: 'Midfielder',
  },
  {
    id: '3',
    firstName: 'Sam',
    lastName: 'Chen',
    email: 'sam@example.com',
    isActive: true,
    position: 'Defender',
  },
  {
    id: '4',
    firstName: 'Jordan',
    lastName: 'Williams',
    email: 'jordan@example.com',
    isActive: true,
    position: 'Goalkeeper',
  },
  {
    id: '5',
    firstName: 'Taylor',
    lastName: 'Brown',
    email: 'taylor@example.com',
    isActive: true,
    position: 'Midfielder',
  },
];

// Interactive wrapper
const InteractiveQuickAddPlayers = ({
  players = mockPlayers,
  playersLoading = false,
  addPlayerLoading = false,
  playersError,
  addPlayerError,
}: {
  players?: UIPlayer[];
  playersLoading?: boolean;
  addPlayerLoading?: boolean;
  playersError?: string;
  addPlayerError?: string;
}) => {
  const [selectedPlayers, setSelectedPlayers] = useState<
    { playerId: string; jersey: number }[]
  >([]);

  const handleSelection = (
    playerId: string,
    isSelected: boolean,
    jersey?: number,
  ) => {
    if (isSelected) {
      setSelectedPlayers((prev) => [
        ...prev,
        { playerId, jersey: jersey || 0 },
      ]);
    } else {
      setSelectedPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
    }
  };

  const handleJerseyChange = (playerId: string, jersey: number) => {
    setSelectedPlayers((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, jersey } : p)),
    );
  };

  return (
    <QuickAddPlayers
      players={players}
      selectedPlayersWithJerseys={selectedPlayers}
      playersLoading={playersLoading}
      addPlayerLoading={addPlayerLoading}
      playersError={playersError}
      addPlayerError={addPlayerError}
      onPlayerSelection={handleSelection}
      onJerseyChange={handleJerseyChange}
      onAddPlayers={() => alert(`Adding ${selectedPlayers.length} players`)}
      onClose={() => alert('Modal closed')}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveQuickAddPlayers />,
};

export const Loading: Story = {
  args: {
    players: [],
    selectedPlayersWithJerseys: [],
    playersLoading: true,
    addPlayerLoading: false,
  },
};

export const Empty: Story = {
  render: () => <InteractiveQuickAddPlayers players={[]} />,
};

export const WithError: Story = {
  render: () => (
    <InteractiveQuickAddPlayers playersError="Failed to load players. Please try again." />
  ),
};

export const AddingPlayers: Story = {
  args: {
    players: mockPlayers,
    selectedPlayersWithJerseys: [
      { playerId: '1', jersey: 10 },
      { playerId: '3', jersey: 4 },
    ],
    playersLoading: false,
    addPlayerLoading: true,
  },
};
