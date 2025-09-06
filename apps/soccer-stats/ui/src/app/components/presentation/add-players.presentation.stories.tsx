import { Player } from '../../services/players-graphql.service';

import { AddPlayersPresentation } from './add-players.presentation';

const meta = {
  title: 'Components/Presentation/AddPlayers',
  component: AddPlayersPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onCreatePlayer: { action: 'player created' },
    onPlayerSelection: { action: 'player selection changed' },
    onFinish: { action: 'finish clicked' },
    onBack: { action: 'back clicked' },
    onSkip: { action: 'skip clicked' },
    playersLoading: {
      control: 'boolean',
    },
    createPlayerLoading: {
      control: 'boolean',
    },
    addPlayerLoading: {
      control: 'boolean',
    },
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

// Sample players data
const samplePlayers: Player[] = [
  { id: '1', name: 'Lionel Messi', position: 'Forward' },
  { id: '2', name: 'Xavi Hernandez', position: 'Midfielder' },
  { id: '3', name: 'Gerard Pique', position: 'Defender' },
  { id: '4', name: 'Ter Stegen', position: 'Goalkeeper' },
  { id: '5', name: 'Sergio Busquets', position: 'Midfielder' },
  { id: '6', name: 'Jordi Alba', position: 'Defender' },
  { id: '7', name: 'Pedri', position: 'Midfielder' },
  { id: '8', name: 'Gavi', position: 'Midfielder' },
  { id: '9', name: 'Robert Lewandowski', position: 'Forward' },
  { id: '10', name: 'Raphinha', position: 'Forward' },
];

export const Default = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: [],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: false,
  },
};

export const WithSelectedPlayers = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: ['1', '2', '3', '4'],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: false,
  },
};

export const LoadingPlayers = {
  args: {
    team: sampleTeam,
    players: [],
    selectedPlayers: [],
    playersLoading: true,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: false,
  },
};

export const CreatingPlayer = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: ['1', '2'],
    playersLoading: false,
    createPlayerLoading: true,
    addPlayerLoading: false,
    isTabMode: false,
  },
};

export const AddingPlayers = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: ['1', '2', '3'],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: true,
    isTabMode: false,
  },
};

export const WithErrors = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: ['1', '2'],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    createPlayerError: 'Failed to create player. Please try again.',
    addPlayerError: 'Failed to add players to team. Please try again.',
    isTabMode: false,
  },
};

export const TabMode = {
  args: {
    team: sampleTeam,
    players: samplePlayers,
    selectedPlayers: ['1', '2', '3'],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: true,
  },
};

export const EmptyPlayersList = {
  args: {
    team: sampleTeam,
    players: [],
    selectedPlayers: [],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: false,
  },
};

export const YouthTeam = {
  args: {
    team: { ...sampleTeam, name: 'Barcelona Youth Academy' },
    players: [
      { id: '1', name: 'Pablo Gavi', position: 'Midfielder' },
      { id: '2', name: 'Ansu Fati', position: 'Forward' },
      { id: '3', name: 'Alejandro Balde', position: 'Defender' },
      { id: '4', name: 'Nico Gonzalez', position: 'Midfielder' },
      { id: '5', name: 'Ferran Torres', position: 'Forward' },
    ],
    selectedPlayers: ['1', '2'],
    playersLoading: false,
    createPlayerLoading: false,
    addPlayerLoading: false,
    isTabMode: false,
  },
};
