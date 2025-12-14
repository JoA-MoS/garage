import { LineupTabPresentation } from './lineup-tab.presentation';

const meta = {
  title: 'Components/Presentation/LineupTab',
  component: LineupTabPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onStatUpdate: { action: 'stat updated' },
  },
};

export default meta;

// Sample player data
const createPlayer = (
  id: number,
  name: string,
  jersey: number,
  position: string,
  isOnField: boolean,
  playTime: number,
  photo?: string
) => ({
  id,
  name,
  jersey,
  position,
  depthRank: 1,
  playTime,
  isOnField,
  photo,
});

const playersOnField = [
  createPlayer(
    1,
    'Lionel Messi',
    10,
    'Forward',
    true,
    2700,
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  ),
  createPlayer(2, 'Kevin De Bruyne', 17, 'Midfielder', true, 2700),
  createPlayer(
    3,
    'Virgil van Dijk',
    4,
    'Defender',
    true,
    2700,
    'https://images.unsplash.com/photo-1594736797933-d0b22d3694a9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  ),
  createPlayer(4, 'Marc-André ter Stegen', 1, 'Goalkeeper', true, 2700),
  createPlayer(5, 'Sadio Mané', 11, 'Forward', true, 2400),
  createPlayer(6, 'Joshua Kimmich', 6, 'Midfielder', true, 2400),
  createPlayer(7, 'Raphaël Varane', 5, 'Defender', true, 2400),
  createPlayer(8, 'Sergio Busquets', 16, 'Midfielder', true, 2100),
  createPlayer(9, 'João Cancelo', 2, 'Defender', true, 2100),
  createPlayer(10, 'Karim Benzema', 9, 'Forward', true, 1800),
  createPlayer(11, 'Jordi Alba', 18, 'Defender', true, 1800),
];

const playersOnBench = [
  createPlayer(
    12,
    'Cristiano Ronaldo',
    7,
    'Forward',
    false,
    900,
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  ),
  createPlayer(13, 'Luka Modrić', 8, 'Midfielder', false, 600),
  createPlayer(14, 'Paulo Dybala', 21, 'Forward', false, 300),
  createPlayer(15, 'Marco Verratti', 23, 'Midfielder', false, 0),
  createPlayer(16, 'Gianluigi Donnarumma', 99, 'Goalkeeper', false, 0),
];

const sampleTeam = {
  name: 'Barcelona',
  players: [...playersOnField, ...playersOnBench],
  goals: [
    {
      id: 'goal1',
      timestamp: 1200,
      scorerId: 1,
      assistId: 2,
      realTime: '2025-08-30T10:30:00Z',
    },
    {
      id: 'goal2',
      timestamp: 2400,
      scorerId: 1,
      realTime: '2025-08-30T10:45:00Z',
    },
  ],
};

export const FullTeam = {
  args: {
    playersOnField,
    playersOnBench,
    team: sampleTeam,
  },
};

export const SmallSquad = {
  args: {
    playersOnField: playersOnField.slice(0, 7),
    playersOnBench: playersOnBench.slice(0, 2),
    team: {
      ...sampleTeam,
      players: [...playersOnField.slice(0, 7), ...playersOnBench.slice(0, 2)],
    },
  },
};

export const LargeBench = {
  args: {
    playersOnField: playersOnField.slice(0, 8),
    playersOnBench: [
      ...playersOnBench,
      createPlayer(17, 'Additional Player 1', 24, 'Midfielder', false, 0),
      createPlayer(18, 'Additional Player 2', 25, 'Forward', false, 0),
      createPlayer(19, 'Additional Player 3', 26, 'Defender', false, 0),
    ],
    team: sampleTeam,
  },
};

export const OnlyStartingEleven = {
  args: {
    playersOnField,
    playersOnBench: [],
    team: {
      ...sampleTeam,
      players: playersOnField,
    },
  },
};

export const MixedPhotoAvailability = {
  args: {
    playersOnField: [
      createPlayer(
        1,
        'Player With Photo',
        10,
        'Forward',
        true,
        2700,
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      ),
      createPlayer(2, 'Player Without Photo', 17, 'Midfielder', true, 2700),
      createPlayer(
        3,
        'Another With Photo',
        4,
        'Defender',
        true,
        2700,
        'https://images.unsplash.com/photo-1594736797933-d0b22d3694a9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      ),
      createPlayer(4, 'Another Without Photo', 1, 'Goalkeeper', true, 2700),
    ],
    playersOnBench: [
      createPlayer(5, 'Bench Player', 7, 'Forward', false, 900),
      createPlayer(
        6,
        'Another Bench Player',
        8,
        'Midfielder',
        false,
        600,
        'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      ),
    ],
    team: sampleTeam,
  },
};
