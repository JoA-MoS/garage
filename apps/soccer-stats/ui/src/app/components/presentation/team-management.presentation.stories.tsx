import { UITeam, UIGameFormat, UIFormation } from '../types/ui.types';

import { TeamManagementPresentation } from './team-management.presentation';
import { TeamManagementTab } from './team-management-tabs.presentation';

const meta = {
  title: 'Components/Presentation/TeamManagement',
  component: TeamManagementPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab changed' },
    onSaveBasicInfo: { action: 'basic info saved' },
    onGameFormatSelect: { action: 'game format selected' },
    onFormationSelect: { action: 'formation selected' },
    onPositionUpdate: { action: 'position updated' },
    onAddPosition: { action: 'position added' },
    onRemovePosition: { action: 'position removed' },
    onCancel: { action: 'cancel clicked' },
    activeTab: {
      control: 'select',
      options: ['basic', 'format', 'formation', 'positions', 'players'],
    },
    isEditing: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample team data
const sampleTeam: UITeam = {
  id: '1',
  name: 'FC Barcelona',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  playerCount: 25,
  createdAt: '2024-01-15',
};

// Sample game formats
const sampleGameFormats: UIGameFormat[] = [
  {
    id: '5v5',
    name: '5 vs 5',
    playerCount: 5,
    description: 'Small-sided games, perfect for youth teams and training',
  },
  {
    id: '7v7',
    name: '7 vs 7',
    playerCount: 7,
    description: 'Popular format for youth leagues and recreational play',
  },
  {
    id: '9v9',
    name: '9 vs 9',
    playerCount: 9,
    description: 'Intermediate format building towards full field play',
  },
  {
    id: '11v11',
    name: '11 vs 11',
    playerCount: 11,
    description: 'Full field soccer, professional and adult league standard',
  },
];

// Sample formations - horizontal layout: GK -> Defense -> Midfield -> Attack
const sampleFormations: UIFormation[] = [
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
];

// Sample positions - horizontal layout: GK -> Defense -> Midfield -> Attack
const samplePositions = [
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

export const BasicInfoTab = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'basic' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
  },
};

export const GameFormatTab = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'format' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
  },
};

export const FormationTab = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'formation' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
    selectedFormation: '11v11-433',
  },
};

export const PositionsTab = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'positions' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
    selectedFormation: '11v11-433',
  },
};

export const PlayersTab = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'players' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
    selectedFormation: '11v11-433',
  },
};

export const NewTeam = {
  args: {
    team: undefined,
    isEditing: true,
    activeTab: 'basic' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: [],
  },
};

export const ViewingMode = {
  args: {
    team: sampleTeam,
    isEditing: false,
    activeTab: 'basic' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
    selectedFormation: '11v11-433',
  },
};

export const YouthTeamSetup = {
  args: {
    team: {
      ...sampleTeam,
      name: 'Barcelona Youth Academy U16',
      playerCount: 18,
    },
    isEditing: true,
    activeTab: 'format' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: sampleFormations[2].positions, // 7v7 formation
    selectedGameFormat: '7v7',
    selectedFormation: '7v7-231',
  },
};

export const CompletedSetup = {
  args: {
    team: sampleTeam,
    isEditing: true,
    activeTab: 'players' as TeamManagementTab,
    gameFormats: sampleGameFormats,
    formations: sampleFormations,
    positions: samplePositions,
    selectedGameFormat: '11v11',
    selectedFormation: '11v11-433',
  },
};
