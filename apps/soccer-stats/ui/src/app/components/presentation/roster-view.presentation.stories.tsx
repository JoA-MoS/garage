import { RosterViewPresentation } from './roster-view.presentation';

const meta = {
  title: 'Components/Presentation/RosterView',
  component: RosterViewPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

// Helper function to create sample players
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

// Sample teams with a mix of players with and without photos
const sampleHomeTeam = {
  name: 'Lightning Bolts',
  players: [
    createPlayer(
      1,
      'Alex Rodriguez',
      10,
      'Forward',
      true,
      2700,
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(2, 'Maria Santos', 7, 'Midfielder', true, 2400),
    createPlayer(
      3,
      'David Kim',
      1,
      'Goalkeeper',
      true,
      2700,
      'https://images.unsplash.com/photo-1594736797933-d0b22d3694a9?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(4, 'Emma Johnson', 5, 'Defender', true, 2500),
    createPlayer(
      5,
      'Carlos Martinez',
      11,
      'Forward',
      false,
      900,
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(6, 'Sophie Chen', 23, 'Midfielder', false, 600),
    createPlayer(7, 'Jake Wilson', 18, 'Defender', false, 300),
    createPlayer(
      8,
      'Isabella Garcia',
      9,
      'Forward',
      false,
      0,
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
  ],
  goals: [],
};

const sampleAwayTeam = {
  name: 'Thunder Hawks',
  players: [
    createPlayer(
      9,
      'Michael Torres',
      21,
      'Goalkeeper',
      true,
      2700,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(10, 'Zoe Anderson', 14, 'Defender', true, 2600),
    createPlayer(
      11,
      'Tyler Brown',
      8,
      'Midfielder',
      true,
      2400,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(12, 'Lily Peterson', 19, 'Forward', true, 2300),
    createPlayer(13, 'Ryan Cooper', 3, 'Defender', false, 800),
    createPlayer(
      14,
      'Grace Taylor',
      16,
      'Midfielder',
      false,
      450,
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    ),
    createPlayer(15, 'Noah Clark', 12, 'Forward', false, 200),
    createPlayer(16, 'Ava Lewis', 25, 'Defender', false, 0),
  ],
  goals: [],
};

export const BothTeams = {
  args: {
    homeTeam: sampleHomeTeam,
    awayTeam: sampleAwayTeam,
    homeTeamName: 'Lightning Bolts',
    awayTeamName: 'Thunder Hawks',
  },
};

export const SmallTeams = {
  args: {
    homeTeam: {
      ...sampleHomeTeam,
      players: sampleHomeTeam.players.slice(0, 4),
    },
    awayTeam: {
      ...sampleAwayTeam,
      players: sampleAwayTeam.players.slice(0, 4),
    },
    homeTeamName: 'Mini Bolts',
    awayTeamName: 'Mini Hawks',
  },
};

export const PlayersWithoutPhotos = {
  args: {
    homeTeam: {
      name: 'No Photo Team',
      players: [
        createPlayer(1, 'Player One', 1, 'Goalkeeper', true, 2700),
        createPlayer(2, 'Player Two', 2, 'Defender', true, 2400),
        createPlayer(3, 'Player Three', 3, 'Midfielder', false, 900),
        createPlayer(4, 'Player Four', 4, 'Forward', false, 600),
      ],
      goals: [],
    },
    awayTeam: {
      name: 'Also No Photo Team',
      players: [
        createPlayer(5, 'Away Player One', 11, 'Goalkeeper', true, 2700),
        createPlayer(6, 'Away Player Two', 12, 'Defender', true, 2400),
        createPlayer(7, 'Away Player Three', 13, 'Midfielder', false, 900),
        createPlayer(8, 'Away Player Four', 14, 'Forward', false, 600),
      ],
      goals: [],
    },
    homeTeamName: 'No Photos FC',
    awayTeamName: 'Still No Photos United',
  },
};
