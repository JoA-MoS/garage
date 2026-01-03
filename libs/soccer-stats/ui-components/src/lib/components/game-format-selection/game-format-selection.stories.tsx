import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UIGameFormat } from '../../types';

import { GameFormatSelection } from './game-format-selection';

const mockGameFormats: UIGameFormat[] = [
  {
    id: '3v3',
    name: '3v3',
    displayName: '3v3 Mini',
    playersPerTeam: 3,
    playersPerSide: 3,
    durationMinutes: 20,
    description: 'Perfect for U6 and younger players',
    allowsSubstitutions: true,
  },
  {
    id: '5v5',
    name: '5v5',
    displayName: '5v5 Small-Sided',
    playersPerTeam: 5,
    playersPerSide: 5,
    durationMinutes: 25,
    description: 'Great for U8-U10 age groups',
    allowsSubstitutions: true,
  },
  {
    id: '7v7',
    name: '7v7',
    displayName: '7v7 Modified',
    playersPerTeam: 7,
    playersPerSide: 7,
    durationMinutes: 30,
    description: 'Standard for U10-U12 leagues',
    allowsSubstitutions: true,
  },
  {
    id: '9v9',
    name: '9v9',
    displayName: '9v9 Transitional',
    playersPerTeam: 9,
    playersPerSide: 9,
    durationMinutes: 35,
    description: 'Bridge to full-field play for U12-U14',
    allowsSubstitutions: true,
  },
  {
    id: '11v11',
    name: '11v11',
    displayName: '11v11 Full Field',
    playersPerTeam: 11,
    playersPerSide: 11,
    durationMinutes: 45,
    description: 'Full regulation soccer for U14 and up',
    allowsSubstitutions: true,
  },
];

const meta: Meta<typeof GameFormatSelection> = {
  component: GameFormatSelection,
  title: 'Components/GameFormatSelection',
  tags: ['autodocs'],
  argTypes: {
    onFormatSelect: { action: 'format-selected' },
    onNext: { action: 'next-clicked' },
    onPrevious: { action: 'previous-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof GameFormatSelection>;

// Interactive wrapper for controlled component
const InteractiveGameFormatSelection = ({
  gameFormats = mockGameFormats,
  isTabMode = false,
}: {
  gameFormats?: UIGameFormat[];
  isTabMode?: boolean;
}) => {
  const [selected, setSelected] = useState<string | undefined>();
  return (
    <GameFormatSelection
      gameFormats={gameFormats}
      selectedFormat={selected}
      onFormatSelect={setSelected}
      onNext={() => alert(`Selected: ${selected}`)}
      onPrevious={() => alert('Previous clicked')}
      isTabMode={isTabMode}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveGameFormatSelection />,
};

export const TabMode: Story = {
  render: () => <InteractiveGameFormatSelection isTabMode />,
};

export const WithPreselected: Story = {
  args: {
    gameFormats: mockGameFormats,
    selectedFormat: '7v7',
    isTabMode: false,
  },
};

export const FewFormats: Story = {
  render: () => (
    <InteractiveGameFormatSelection gameFormats={mockGameFormats.slice(0, 3)} />
  ),
};
