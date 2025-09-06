import { TeamConfigurationPresentation } from './team-configuration.presentation';

const meta = {
  title: 'Components/Presentation/TeamConfiguration',
  component: TeamConfigurationPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onFormationChange: { action: 'formation changed' },
    onPlayersOnFieldChange: { action: 'players on field changed' },
    onPositionUpdate: { action: 'position updated' },
    onContinue: { action: 'continue clicked' },
    onBack: { action: 'back clicked' },
    isTabMode: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample team data
const sampleTeam = {
  id: '1',
  name: 'FC Barcelona',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  games: [],
  players: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

// Sample configuration data - horizontal layout: GK -> Defense -> Midfield -> Attack
const sampleConfiguration = {
  gameFormat: '11v11',
  formation: '4-3-3',
  playersOnField: 11,
  positions: [
    {
      id: '1',
      name: 'Goalkeeper',
      abbreviation: 'GK',
      x: 10,
      y: 50,
      playerId: null,
    },
    {
      id: '2',
      name: 'Right Back',
      abbreviation: 'RB',
      x: 25,
      y: 20,
      playerId: null,
    },
    {
      id: '3',
      name: 'Center Back',
      abbreviation: 'CB',
      x: 25,
      y: 35,
      playerId: null,
    },
    {
      id: '4',
      name: 'Center Back',
      abbreviation: 'CB',
      x: 25,
      y: 65,
      playerId: null,
    },
    {
      id: '5',
      name: 'Left Back',
      abbreviation: 'LB',
      x: 25,
      y: 80,
      playerId: null,
    },
    {
      id: '6',
      name: 'Defensive Midfielder',
      abbreviation: 'CDM',
      x: 45,
      y: 50,
      playerId: null,
    },
    {
      id: '7',
      name: 'Central Midfielder',
      abbreviation: 'CM',
      x: 60,
      y: 35,
      playerId: null,
    },
    {
      id: '8',
      name: 'Central Midfielder',
      abbreviation: 'CM',
      x: 60,
      y: 65,
      playerId: null,
    },
    {
      id: '9',
      name: 'Right Winger',
      abbreviation: 'RW',
      x: 80,
      y: 20,
      playerId: null,
    },
    {
      id: '10',
      name: 'Striker',
      abbreviation: 'ST',
      x: 85,
      y: 50,
      playerId: null,
    },
    {
      id: '11',
      name: 'Left Winger',
      abbreviation: 'LW',
      x: 80,
      y: 80,
      playerId: null,
    },
  ],
};

const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'];

export const Default = {
  args: {
    team: sampleTeam,
    configuration: sampleConfiguration,
    formations: formations,
    isTabMode: false,
  },
};

export const TabMode = {
  args: {
    team: sampleTeam,
    configuration: sampleConfiguration,
    formations: formations,
    isTabMode: true,
  },
};

export const DifferentFormation = {
  args: {
    team: sampleTeam,
    configuration: {
      ...sampleConfiguration,
      formation: '4-4-2',
      positions: [
        {
          id: '1',
          name: 'Goalkeeper',
          abbreviation: 'GK',
          x: 10,
          y: 50,
          playerId: null,
        },
        {
          id: '2',
          name: 'Right Back',
          abbreviation: 'RB',
          x: 25,
          y: 20,
          playerId: null,
        },
        {
          id: '3',
          name: 'Center Back',
          abbreviation: 'CB',
          x: 25,
          y: 35,
          playerId: null,
        },
        {
          id: '4',
          name: 'Center Back',
          abbreviation: 'CB',
          x: 25,
          y: 65,
          playerId: null,
        },
        {
          id: '5',
          name: 'Left Back',
          abbreviation: 'LB',
          x: 25,
          y: 80,
          playerId: null,
        },
        {
          id: '6',
          name: 'Right Midfielder',
          abbreviation: 'RM',
          x: 55,
          y: 20,
          playerId: null,
        },
        {
          id: '7',
          name: 'Central Midfielder',
          abbreviation: 'CM',
          x: 50,
          y: 35,
          playerId: null,
        },
        {
          id: '8',
          name: 'Central Midfielder',
          abbreviation: 'CM',
          x: 50,
          y: 65,
          playerId: null,
        },
        {
          id: '9',
          name: 'Left Midfielder',
          abbreviation: 'LM',
          x: 55,
          y: 80,
          playerId: null,
        },
        {
          id: '10',
          name: 'Striker',
          abbreviation: 'ST',
          x: 85,
          y: 35,
          playerId: null,
        },
        {
          id: '11',
          name: 'Striker',
          abbreviation: 'ST',
          x: 85,
          y: 65,
          playerId: null,
        },
      ],
    },
    formations: formations,
    isTabMode: false,
  },
};

export const SmallFormat = {
  args: {
    team: { ...sampleTeam, name: 'Youth Team' },
    configuration: {
      gameFormat: '7v7',
      formation: '2-3-1',
      playersOnField: 7,
      positions: [
        {
          id: '1',
          name: 'Goalkeeper',
          abbreviation: 'GK',
          x: 10,
          y: 50,
          playerId: null,
        },
        {
          id: '2',
          name: 'Right Back',
          abbreviation: 'RB',
          x: 30,
          y: 30,
          playerId: null,
        },
        {
          id: '3',
          name: 'Left Back',
          abbreviation: 'LB',
          x: 30,
          y: 70,
          playerId: null,
        },
        {
          id: '4',
          name: 'Right Midfielder',
          abbreviation: 'RM',
          x: 60,
          y: 25,
          playerId: null,
        },
        {
          id: '5',
          name: 'Central Midfielder',
          abbreviation: 'CM',
          x: 60,
          y: 50,
          playerId: null,
        },
        {
          id: '6',
          name: 'Left Midfielder',
          abbreviation: 'LM',
          x: 60,
          y: 75,
          playerId: null,
        },
        {
          id: '7',
          name: 'Striker',
          abbreviation: 'ST',
          x: 85,
          y: 50,
          playerId: null,
        },
      ],
    },
    formations: ['2-3-1', '3-2-1', '2-2-2'],
    isTabMode: false,
  },
};
