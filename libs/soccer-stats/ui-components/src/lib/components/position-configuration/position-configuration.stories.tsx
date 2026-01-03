import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UIPosition } from '../../types';

import { PositionConfiguration } from './position-configuration';

const meta: Meta<typeof PositionConfiguration> = {
  component: PositionConfiguration,
  title: 'Components/PositionConfiguration',
  tags: ['autodocs'],
  argTypes: {
    onPositionUpdate: { action: 'position-updated' },
    onAddPosition: { action: 'position-added' },
    onRemovePosition: { action: 'position-removed' },
    onNext: { action: 'next-clicked' },
    onPrevious: { action: 'previous-clicked' },
    isTabMode: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PositionConfiguration>;

// Sample position data for 4-3-3 formation - horizontal layout: GK -> Defense -> Midfield -> Attack
const formation433Positions: UIPosition[] = [
  { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
  { id: '2', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
  { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 35 },
  { id: '4', name: 'Center Back', abbreviation: 'CB', x: 25, y: 65 },
  { id: '5', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
  { id: '6', name: 'Defensive Midfielder', abbreviation: 'CDM', x: 45, y: 50 },
  { id: '7', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 35 },
  { id: '8', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 65 },
  { id: '9', name: 'Right Winger', abbreviation: 'RW', x: 80, y: 20 },
  { id: '10', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
  { id: '11', name: 'Left Winger', abbreviation: 'LW', x: 80, y: 80 },
];

// Sample position data for 4-4-2 formation
const formation442Positions: UIPosition[] = [
  { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
  { id: '2', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
  { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 35 },
  { id: '4', name: 'Center Back', abbreviation: 'CB', x: 25, y: 65 },
  { id: '5', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
  { id: '6', name: 'Right Midfielder', abbreviation: 'RM', x: 55, y: 20 },
  { id: '7', name: 'Central Midfielder', abbreviation: 'CM', x: 50, y: 35 },
  { id: '8', name: 'Central Midfielder', abbreviation: 'CM', x: 50, y: 65 },
  { id: '9', name: 'Left Midfielder', abbreviation: 'LM', x: 55, y: 80 },
  { id: '10', name: 'Striker', abbreviation: 'ST', x: 85, y: 35 },
  { id: '11', name: 'Striker', abbreviation: 'ST', x: 85, y: 65 },
];

// Sample position data for 7v7 format
const formation7v7Positions: UIPosition[] = [
  { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
  { id: '2', name: 'Right Back', abbreviation: 'RB', x: 30, y: 30 },
  { id: '3', name: 'Left Back', abbreviation: 'LB', x: 30, y: 70 },
  { id: '4', name: 'Right Midfielder', abbreviation: 'RM', x: 60, y: 25 },
  { id: '5', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 50 },
  { id: '6', name: 'Left Midfielder', abbreviation: 'LM', x: 60, y: 75 },
  { id: '7', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
];

// Sample position data for 5v5 format
const formation5v5Positions: UIPosition[] = [
  { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
  { id: '2', name: 'Right Back', abbreviation: 'RB', x: 40, y: 30 },
  { id: '3', name: 'Left Back', abbreviation: 'LB', x: 40, y: 70 },
  { id: '4', name: 'Midfielder', abbreviation: 'MF', x: 65, y: 50 },
  { id: '5', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
];

// Interactive wrapper for controlled component
const InteractivePositionConfiguration = ({
  initialPositions = formation433Positions,
  isTabMode = false,
}: {
  initialPositions?: UIPosition[];
  isTabMode?: boolean;
}) => {
  const [positions, setPositions] = useState<UIPosition[]>(initialPositions);
  let nextId = positions.length + 1;

  const handlePositionUpdate = (
    positionId: string,
    updates: Partial<UIPosition>,
  ) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === positionId ? { ...p, ...updates } : p)),
    );
  };

  const handleAddPosition = () => {
    const newPosition: UIPosition = {
      id: String(nextId++),
      name: `New Position ${positions.length + 1}`,
      abbreviation: 'NEW',
      x: 50,
      y: 50,
    };
    setPositions((prev) => [...prev, newPosition]);
  };

  const handleRemovePosition = (positionId: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== positionId));
  };

  return (
    <PositionConfiguration
      positions={positions}
      onPositionUpdate={handlePositionUpdate}
      onAddPosition={handleAddPosition}
      onRemovePosition={handleRemovePosition}
      onNext={() => alert('Next clicked')}
      onPrevious={() => alert('Previous clicked')}
      isTabMode={isTabMode}
    />
  );
};

export const Default433Formation: Story = {
  render: () => <InteractivePositionConfiguration />,
};

export const Formation442: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={formation442Positions}
    />
  ),
};

export const Youth7v7Formation: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={formation7v7Positions}
    />
  ),
};

export const Small5v5Formation: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={formation5v5Positions}
    />
  ),
};

export const TabMode: Story = {
  render: () => <InteractivePositionConfiguration isTabMode />,
};

export const MinimalPositions: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={[
        { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
        { id: '2', name: 'Defender', abbreviation: 'DEF', x: 40, y: 50 },
        { id: '3', name: 'Midfielder', abbreviation: 'MID', x: 65, y: 50 },
        { id: '4', name: 'Forward', abbreviation: 'FWD', x: 85, y: 50 },
      ]}
    />
  ),
};

export const OverlappingPositions: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={[
        { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
        { id: '2', name: 'Center Back 1', abbreviation: 'CB', x: 25, y: 45 },
        { id: '3', name: 'Center Back 2', abbreviation: 'CB', x: 25, y: 55 },
        { id: '4', name: 'Midfielder 1', abbreviation: 'CM', x: 50, y: 48 },
        { id: '5', name: 'Midfielder 2', abbreviation: 'CM', x: 50, y: 52 },
        { id: '6', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
      ]}
    />
  ),
};

export const WideFormation: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={[
        { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
        { id: '2', name: 'Right Back', abbreviation: 'RB', x: 30, y: 10 },
        { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 50 },
        { id: '4', name: 'Left Back', abbreviation: 'LB', x: 30, y: 90 },
        { id: '5', name: 'Right Wing', abbreviation: 'RW', x: 65, y: 15 },
        { id: '6', name: 'Central Mid', abbreviation: 'CM', x: 55, y: 50 },
        { id: '7', name: 'Left Wing', abbreviation: 'LW', x: 65, y: 85 },
        { id: '8', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
      ]}
    />
  ),
};

export const CompactFormation: Story = {
  render: () => (
    <InteractivePositionConfiguration
      initialPositions={[
        { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 15, y: 50 },
        { id: '2', name: 'Right Back', abbreviation: 'RB', x: 35, y: 35 },
        { id: '3', name: 'Center Back', abbreviation: 'CB', x: 30, y: 50 },
        { id: '4', name: 'Left Back', abbreviation: 'LB', x: 35, y: 65 },
        { id: '5', name: 'Right Mid', abbreviation: 'RM', x: 55, y: 35 },
        { id: '6', name: 'Central Mid', abbreviation: 'CM', x: 50, y: 50 },
        { id: '7', name: 'Left Mid', abbreviation: 'LM', x: 55, y: 65 },
        { id: '8', name: 'Attacking Mid', abbreviation: 'AM', x: 70, y: 50 },
        { id: '9', name: 'Striker', abbreviation: 'ST', x: 80, y: 50 },
      ]}
    />
  ),
};
