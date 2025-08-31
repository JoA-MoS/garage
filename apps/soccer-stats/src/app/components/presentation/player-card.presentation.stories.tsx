import { PlayerCardPresentation } from './player-card.presentation';

const meta = {
  title: 'Components/Presentation/PlayerCard',
  component: PlayerCardPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isOnField: {
      control: 'boolean',
    },
    showStatButtons: {
      control: 'boolean',
    },
    showPhase1Stats: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample player data
const samplePlayer = {
  id: 1,
  name: 'Lionel Messi',
  jersey: 10,
  position: 'Forward',
  depthRank: 1,
  playTime: 2700, // 45 minutes
  isOnField: true,
  photo:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
};

const benchPlayer = {
  id: 2,
  name: 'Cristiano Ronaldo',
  jersey: 7,
  position: 'Forward',
  depthRank: 2,
  playTime: 900, // 15 minutes
  isOnField: false,
  photo:
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
};

const playerWithoutPhoto = {
  id: 3,
  name: 'Kevin De Bruyne',
  jersey: 17,
  position: 'Midfielder',
  depthRank: 1,
  playTime: 2400, // 40 minutes
  isOnField: true,
};

const goalkeeper = {
  id: 4,
  name: 'Marc-André ter Stegen',
  jersey: 1,
  position: 'Goalkeeper',
  depthRank: 1,
  playTime: 5400, // 90 minutes
  isOnField: true,
  photo:
    'https://images.unsplash.com/photo-1594736797933-d0b22d3694a9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
};

export const OnFieldWithPhoto = {
  args: {
    player: samplePlayer,
    isOnField: true,
    goals: 2,
    assists: 1,
    showStatButtons: true,
  },
};

export const OnBenchWithPhoto = {
  args: {
    player: benchPlayer,
    isOnField: false,
    goals: 1,
    assists: 0,
    showStatButtons: true,
  },
};

export const WithoutPhoto = {
  args: {
    player: playerWithoutPhoto,
    isOnField: true,
    goals: 0,
    assists: 3,
    showStatButtons: true,
  },
};

export const WithoutStatButtons = {
  args: {
    player: samplePlayer,
    isOnField: true,
    goals: 2,
    assists: 1,
    showStatButtons: false,
  },
};

export const Goalkeeper = {
  args: {
    player: goalkeeper,
    isOnField: true,
    goals: 0,
    assists: 0,
    showStatButtons: true,
  },
};

export const HighStats = {
  args: {
    player: {
      ...samplePlayer,
      name: 'Robert Lewandowski',
      jersey: 9,
    },
    isOnField: true,
    goals: 4,
    assists: 2,
    showStatButtons: true,
  },
};

export const BenchPlayerNoStats = {
  args: {
    player: {
      ...benchPlayer,
      name: 'Substitute Player',
      jersey: 23,
      playTime: 0,
    },
    isOnField: false,
    goals: 0,
    assists: 0,
    showStatButtons: false,
  },
};

export const LongPlayerName = {
  args: {
    player: {
      ...samplePlayer,
      name: 'Jean-Philippe Mateta-Boateng',
      jersey: 99,
    },
    isOnField: true,
    goals: 1,
    assists: 1,
    showStatButtons: true,
  },
};

export const WithPhase1Stats = {
  args: {
    player: samplePlayer,
    isOnField: true,
    goals: 2,
    assists: 1,
    yellowCards: 1,
    redCards: 0,
    foulsCommitted: 3,
    foulsReceived: 2,
    shotsOnTarget: 5, // 2 goals + 3 additional shots on target
    shotsOffTarget: 2,
    saves: 0,
    showStatButtons: true,
    showPhase1Stats: true,
  },
};

export const GoalkeeperWithPhase1Stats = {
  args: {
    player: goalkeeper,
    isOnField: true,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    foulsCommitted: 1,
    foulsReceived: 2,
    shotsOnTarget: 0,
    shotsOffTarget: 0,
    saves: 7,
    showStatButtons: true,
    showPhase1Stats: true,
  },
};
