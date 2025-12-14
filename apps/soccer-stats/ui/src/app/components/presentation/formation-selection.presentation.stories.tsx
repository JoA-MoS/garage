import { UIFormation } from '../types/ui.types';

import { FormationSelectionPresentation } from './formation-selection.presentation';

const meta = {
  title: 'Components/Presentation/FormationSelection',
  component: FormationSelectionPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onFormationSelect: { action: 'formation selected' },
    onNext: { action: 'next clicked' },
    onPrevious: { action: 'previous clicked' },
    isTabMode: {
      control: 'boolean',
    },
    gameFormat: {
      control: 'select',
      options: ['5v5', '7v7', '9v9', '11v11'],
    },
  },
};

export default meta;

// Sample formations data - positioned horizontally from left to right: GK -> Defense -> Midfield -> Attack
const sampleFormations: UIFormation[] = [
  // 11v11 formations
  {
    id: '11v11-433',
    name: '4-3-3',
    gameFormat: '11v11',
    playerCount: 11,
    positions: [
      { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: '2', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
      { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 35 },
      { id: '4', name: 'Center Back', abbreviation: 'CB', x: 25, y: 65 },
      { id: '5', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
      {
        id: '6',
        name: 'Defensive Midfielder',
        abbreviation: 'CDM',
        x: 45,
        y: 50,
      },
      { id: '7', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 35 },
      { id: '8', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 65 },
      { id: '9', name: 'Right Winger', abbreviation: 'RW', x: 80, y: 20 },
      { id: '10', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
      { id: '11', name: 'Left Winger', abbreviation: 'LW', x: 80, y: 80 },
    ],
  },
  {
    id: '11v11-442',
    name: '4-4-2',
    gameFormat: '11v11',
    playerCount: 11,
    positions: [
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
    ],
  },
  {
    id: '11v11-352',
    name: '3-5-2',
    gameFormat: '11v11',
    playerCount: 11,
    positions: [
      { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: '2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 30 },
      { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 50 },
      { id: '4', name: 'Center Back', abbreviation: 'CB', x: 25, y: 70 },
      { id: '5', name: 'Right Wing Back', abbreviation: 'RWB', x: 50, y: 15 },
      { id: '6', name: 'Central Midfielder', abbreviation: 'CM', x: 55, y: 35 },
      { id: '7', name: 'Central Midfielder', abbreviation: 'CM', x: 50, y: 50 },
      { id: '8', name: 'Central Midfielder', abbreviation: 'CM', x: 55, y: 65 },
      { id: '9', name: 'Left Wing Back', abbreviation: 'LWB', x: 50, y: 85 },
      { id: '10', name: 'Striker', abbreviation: 'ST', x: 85, y: 35 },
      { id: '11', name: 'Striker', abbreviation: 'ST', x: 85, y: 65 },
    ],
  },
  // 7v7 formations
  {
    id: '7v7-231',
    name: '2-3-1',
    gameFormat: '7v7',
    playerCount: 7,
    positions: [
      { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: '2', name: 'Right Back', abbreviation: 'RB', x: 30, y: 30 },
      { id: '3', name: 'Left Back', abbreviation: 'LB', x: 30, y: 70 },
      { id: '4', name: 'Right Midfielder', abbreviation: 'RM', x: 60, y: 25 },
      { id: '5', name: 'Central Midfielder', abbreviation: 'CM', x: 60, y: 50 },
      { id: '6', name: 'Left Midfielder', abbreviation: 'LM', x: 60, y: 75 },
      { id: '7', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
    ],
  },
  {
    id: '7v7-321',
    name: '3-2-1',
    gameFormat: '7v7',
    playerCount: 7,
    positions: [
      { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: '2', name: 'Right Back', abbreviation: 'RB', x: 30, y: 25 },
      { id: '3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 50 },
      { id: '4', name: 'Left Back', abbreviation: 'LB', x: 30, y: 75 },
      { id: '5', name: 'Right Midfielder', abbreviation: 'RM', x: 60, y: 30 },
      { id: '6', name: 'Left Midfielder', abbreviation: 'LM', x: 60, y: 70 },
      { id: '7', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
    ],
  },
  // 5v5 formations
  {
    id: '5v5-121',
    name: '1-2-1',
    gameFormat: '5v5',
    playerCount: 5,
    positions: [
      { id: '1', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: '2', name: 'Right Back', abbreviation: 'RB', x: 40, y: 30 },
      { id: '3', name: 'Left Back', abbreviation: 'LB', x: 40, y: 70 },
      { id: '4', name: 'Midfielder', abbreviation: 'MF', x: 65, y: 50 },
      { id: '5', name: 'Striker', abbreviation: 'ST', x: 85, y: 50 },
    ],
  },
];

export const Default11v11 = {
  args: {
    formations: sampleFormations,
    gameFormat: '11v11',
    selectedFormation: undefined,
    isTabMode: false,
  },
};

export const Selected11v11Formation = {
  args: {
    formations: sampleFormations,
    gameFormat: '11v11',
    selectedFormation: '11v11-433',
    isTabMode: false,
  },
};

export const Youth7v7Format = {
  args: {
    formations: sampleFormations,
    gameFormat: '7v7',
    selectedFormation: '7v7-231',
    isTabMode: false,
  },
};

export const Small5v5Format = {
  args: {
    formations: sampleFormations,
    gameFormat: '5v5',
    selectedFormation: undefined,
    isTabMode: false,
  },
};

export const TabMode = {
  args: {
    formations: sampleFormations,
    gameFormat: '11v11',
    selectedFormation: '11v11-442',
    isTabMode: true,
  },
};

export const EmptyFormations = {
  args: {
    formations: [],
    gameFormat: '11v11',
    selectedFormation: undefined,
    isTabMode: false,
  },
};

export const AllFormats = {
  args: {
    formations: sampleFormations,
    gameFormat: '11v11',
    selectedFormation: '11v11-433',
    isTabMode: false,
  },
  render: (args) => {
    const formats = ['11v11', '7v7', '5v5'];

    return (
      <div className="space-y-8">
        {formats.map((format) => (
          <div key={format}>
            <h3 className="text-lg font-semibold mb-4">{format} Format</h3>
            <FormationSelectionPresentation
              {...args}
              gameFormat={format}
              selectedFormation={undefined}
            />
          </div>
        ))}
      </div>
    );
  },
};
