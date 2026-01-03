import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UIFormation } from '../../types';

import { FormationSelection } from './formation-selection';

const mockFormations: UIFormation[] = [
  {
    id: '3v3-triangle',
    name: 'Triangle (1-2)',
    description: 'One defender, two forwards',
    gameFormat: '3v3',
    playersPerSide: 3,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 50, y: 90 },
      { id: 'lf', name: 'Left Forward', abbreviation: 'LF', x: 25, y: 30 },
      { id: 'rf', name: 'Right Forward', abbreviation: 'RF', x: 75, y: 30 },
    ],
  },
  {
    id: '5v5-diamond',
    name: 'Diamond (1-2-1)',
    description: 'Classic diamond formation',
    gameFormat: '5v5',
    playersPerSide: 5,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 50, y: 90 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 70 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 75, y: 70 },
      { id: 'cm', name: 'Center Mid', abbreviation: 'CM', x: 50, y: 50 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 50, y: 20 },
    ],
  },
  {
    id: '5v5-pyramid',
    name: 'Pyramid (2-1-1)',
    description: 'Defensive pyramid formation',
    gameFormat: '5v5',
    playersPerSide: 5,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 50, y: 90 },
      { id: 'cb1', name: 'Center Back 1', abbreviation: 'CB', x: 35, y: 70 },
      { id: 'cb2', name: 'Center Back 2', abbreviation: 'CB', x: 65, y: 70 },
      { id: 'cm', name: 'Center Mid', abbreviation: 'CM', x: 50, y: 45 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 50, y: 20 },
    ],
  },
  {
    id: '7v7-231',
    name: '2-3-1 Formation',
    description: 'Balanced attack and defense',
    gameFormat: '7v7',
    playersPerSide: 7,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 50, y: 90 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 75 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 75, y: 75 },
      { id: 'lm', name: 'Left Mid', abbreviation: 'LM', x: 20, y: 50 },
      { id: 'cm', name: 'Center Mid', abbreviation: 'CM', x: 50, y: 50 },
      { id: 'rm', name: 'Right Mid', abbreviation: 'RM', x: 80, y: 50 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 50, y: 20 },
    ],
  },
];

const meta: Meta<typeof FormationSelection> = {
  component: FormationSelection,
  title: 'Components/FormationSelection',
  tags: ['autodocs'],
  argTypes: {
    onFormationSelect: { action: 'formation-selected' },
    onNext: { action: 'next-clicked' },
    onPrevious: { action: 'previous-clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof FormationSelection>;

// Interactive wrapper for controlled component
const InteractiveFormationSelection = ({
  formations = mockFormations,
  gameFormat = '5v5',
  isTabMode = false,
}: {
  formations?: UIFormation[];
  gameFormat?: string;
  isTabMode?: boolean;
}) => {
  const [selected, setSelected] = useState<string | undefined>();
  return (
    <FormationSelection
      formations={formations}
      selectedFormation={selected}
      gameFormat={gameFormat}
      onFormationSelect={setSelected}
      onNext={() => alert(`Selected: ${selected}`)}
      onPrevious={() => alert('Previous clicked')}
      isTabMode={isTabMode}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveFormationSelection />,
};

export const TabMode: Story = {
  render: () => <InteractiveFormationSelection isTabMode />,
};

export const ThreeVThree: Story = {
  render: () => <InteractiveFormationSelection gameFormat="3v3" />,
};

export const SevenVSeven: Story = {
  render: () => <InteractiveFormationSelection gameFormat="7v7" />,
};

export const WithPreselected: Story = {
  args: {
    formations: mockFormations,
    selectedFormation: '5v5-diamond',
    gameFormat: '5v5',
    isTabMode: false,
  },
};

export const NoFormationsAvailable: Story = {
  args: {
    formations: mockFormations,
    gameFormat: '11v11', // No formations match this
    isTabMode: false,
  },
};
