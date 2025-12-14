import { PlayerStatsTablePresentation } from './player-stats-table.presentation';

const meta = {
  title: 'Components/Presentation/PlayerStatsTable',
  component: PlayerStatsTablePresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

// Sample player data generator
const createPlayer = (
  id: number,
  name: string,
  jersey: number,
  position: string,
  isOnField: boolean,
  playTime: number
) => ({
  id,
  name,
  jersey,
  position,
  depthRank: 1,
  playTime,
  isOnField,
});

const samplePlayersData = [
  // Home team players
  {
    player: createPlayer(1, 'Lionel Messi', 10, 'Forward', true, 4500),
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 2,
    assists: 1,
  },
  {
    player: createPlayer(2, 'Kevin De Bruyne', 17, 'Midfielder', true, 4200),
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 1,
    assists: 3,
  },
  {
    player: createPlayer(3, 'Virgil van Dijk', 4, 'Defender', true, 4500),
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 0,
    assists: 0,
  },
  {
    player: createPlayer(
      4,
      'Marc-André ter Stegen',
      1,
      'Goalkeeper',
      true,
      4500
    ),
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 0,
    assists: 0,
  },
  {
    player: createPlayer(5, 'Sadio Mané', 11, 'Forward', false, 2400),
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 1,
    assists: 0,
  },

  // Away team players
  {
    player: createPlayer(6, 'Cristiano Ronaldo', 7, 'Forward', true, 4500),
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 2,
    assists: 1,
  },
  {
    player: createPlayer(7, 'Luka Modrić', 8, 'Midfielder', true, 4200),
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 2,
  },
  {
    player: createPlayer(8, 'Kylian Mbappé', 10, 'Forward', true, 3900),
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 1,
    assists: 1,
  },
  {
    player: createPlayer(
      9,
      'Gianluigi Donnarumma',
      99,
      'Goalkeeper',
      true,
      4500
    ),
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 0,
  },
  {
    player: createPlayer(10, 'Neymar Jr', 11, 'Forward', false, 2700),
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 1,
  },
];

export const StandardGame = {
  args: {
    allPlayers: samplePlayersData,
  },
};

export const HighScoringGame = {
  args: {
    allPlayers: samplePlayersData.map((p) => ({
      ...p,
      goals: p.goals + Math.floor(Math.random() * 2),
      assists: p.assists + Math.floor(Math.random() * 2),
    })),
  },
};

export const ManySubstitutions = {
  args: {
    allPlayers: [
      ...samplePlayersData.slice(0, 6).map((p) => ({
        ...p,
        player: { ...p.player, isOnField: true },
      })),
      ...samplePlayersData.slice(6).map((p) => ({
        ...p,
        player: {
          ...p.player,
          isOnField: false,
          playTime: Math.max(0, p.player.playTime - 1800),
        },
      })),
      // Add some extra bench players
      {
        player: createPlayer(
          11,
          'Substitute Player 1',
          23,
          'Midfielder',
          false,
          900
        ),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(
          12,
          'Substitute Player 2',
          24,
          'Forward',
          false,
          600
        ),
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 1,
        assists: 0,
      },
    ],
  },
};

export const LopsidedStats = {
  args: {
    allPlayers: [
      {
        player: createPlayer(1, 'Star Player', 10, 'Forward', true, 4500),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 4,
        assists: 2,
      },
      {
        player: createPlayer(2, 'Playmaker', 8, 'Midfielder', true, 4200),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 5,
      },
      {
        player: createPlayer(3, 'Defender', 4, 'Defender', true, 4500),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(4, 'Goalkeeper', 1, 'Goalkeeper', true, 4500),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(5, 'Opposition Player', 7, 'Forward', true, 4500),
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(6, 'Opposition GK', 99, 'Goalkeeper', true, 4500),
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
    ],
  },
};

export const SmallRoster = {
  args: {
    allPlayers: samplePlayersData.slice(0, 6),
  },
};

export const VaryingPlayTimes = {
  args: {
    allPlayers: [
      {
        player: createPlayer(1, 'Full Game Player', 10, 'Forward', true, 5400),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 2,
        assists: 1,
      },
      {
        player: createPlayer(2, 'Late Sub', 17, 'Midfielder', true, 600),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 1,
        assists: 0,
      },
      {
        player: createPlayer(3, 'Early Sub Out', 4, 'Defender', false, 1800),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(4, 'Unused Sub', 23, 'Forward', false, 0),
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(5, 'Injury Sub', 7, 'Forward', false, 300),
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: createPlayer(6, 'Fresh Player', 8, 'Midfielder', true, 2700),
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 1,
        assists: 2,
      },
    ],
  },
};
