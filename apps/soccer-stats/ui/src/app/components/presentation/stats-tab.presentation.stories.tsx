import { StatsTabPresentation } from './stats-tab.presentation';

const meta = {
  title: 'Components/Presentation/StatsTab',
  component: StatsTabPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

// Sample player data for presentation
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

const homeTeam = {
  name: 'Barcelona',
  players: [
    createPlayer(1, 'Lionel Messi', 10, 'Forward', true, 4500),
    createPlayer(2, 'Kevin De Bruyne', 17, 'Midfielder', true, 4200),
    createPlayer(3, 'Virgil van Dijk', 4, 'Defender', true, 4500),
    createPlayer(4, 'Marc-André ter Stegen', 1, 'Goalkeeper', true, 4500),
    createPlayer(5, 'Sadio Mané', 11, 'Forward', false, 2400),
  ],
  goals: [],
};

const awayTeam = {
  name: 'Real Madrid',
  players: [
    createPlayer(6, 'Cristiano Ronaldo', 7, 'Forward', true, 4500),
    createPlayer(7, 'Luka Modrić', 8, 'Midfielder', true, 4200),
    createPlayer(8, 'Kylian Mbappé', 10, 'Forward', true, 3900),
    createPlayer(9, 'Gianluigi Donnarumma', 99, 'Goalkeeper', true, 4500),
    createPlayer(10, 'Neymar Jr', 11, 'Forward', false, 2700),
  ],
  goals: [],
};

const samplePlayerStats = [
  {
    player: homeTeam.players[0],
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 2,
    assists: 1,
  },
  {
    player: homeTeam.players[1],
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 1,
    assists: 3,
  },
  {
    player: homeTeam.players[2],
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 0,
    assists: 0,
  },
  {
    player: homeTeam.players[3],
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 0,
    assists: 0,
  },
  {
    player: homeTeam.players[4],
    team: 'home' as const,
    teamName: 'Barcelona',
    goals: 1,
    assists: 0,
  },
  {
    player: awayTeam.players[0],
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 2,
    assists: 1,
  },
  {
    player: awayTeam.players[1],
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 2,
  },
  {
    player: awayTeam.players[2],
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 1,
    assists: 1,
  },
  {
    player: awayTeam.players[3],
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 0,
  },
  {
    player: awayTeam.players[4],
    team: 'away' as const,
    teamName: 'Real Madrid',
    goals: 0,
    assists: 1,
  },
];

export const ActiveGame = {
  args: {
    homeTeam,
    awayTeam,
    gameTime: 4500, // 75 minutes
    homeGoals: 4,
    awayGoals: 3,
    homeAssists: 4,
    awayAssists: 5,
    totalGoals: 7,
    totalAssists: 9,
    assistRate: 129, // 9 assists / 7 goals * 100
    allPlayers: samplePlayerStats,
  },
};

export const HighScoringGame = {
  args: {
    homeTeam,
    awayTeam,
    gameTime: 5400, // 90 minutes
    homeGoals: 6,
    awayGoals: 4,
    homeAssists: 7,
    awayAssists: 4,
    totalGoals: 10,
    totalAssists: 11,
    assistRate: 110, // 11 assists / 10 goals * 100
    allPlayers: samplePlayerStats.map((p) => ({
      ...p,
      goals: p.goals + Math.floor(Math.random() * 2),
      assists: p.assists + Math.floor(Math.random() * 2),
    })),
  },
};

export const EarlyGame = {
  args: {
    homeTeam,
    awayTeam,
    gameTime: 1500, // 25 minutes
    homeGoals: 1,
    awayGoals: 0,
    homeAssists: 1,
    awayAssists: 0,
    totalGoals: 1,
    totalAssists: 1,
    assistRate: 100, // 1 assist / 1 goal * 100
    allPlayers: samplePlayerStats.map((p) => ({
      ...p,
      goals: p.player.id === 1 ? 1 : 0, // Only Messi scored
      assists: p.player.id === 2 ? 1 : 0, // Only De Bruyne assisted
    })),
  },
};

export const ScorelessGame = {
  args: {
    homeTeam,
    awayTeam,
    gameTime: 5400, // 90 minutes
    homeGoals: 0,
    awayGoals: 0,
    homeAssists: 0,
    awayAssists: 0,
    totalGoals: 0,
    totalAssists: 0,
    assistRate: 0, // 0 assists / 0 goals
    allPlayers: samplePlayerStats.map((p) => ({
      ...p,
      goals: 0,
      assists: 0,
    })),
  },
};

export const OneTeamDominating = {
  args: {
    homeTeam,
    awayTeam,
    gameTime: 4200, // 70 minutes
    homeGoals: 5,
    awayGoals: 0,
    homeAssists: 4,
    awayAssists: 0,
    totalGoals: 5,
    totalAssists: 4,
    assistRate: 80, // 4 assists / 5 goals * 100
    allPlayers: [
      {
        player: homeTeam.players[0],
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 3,
        assists: 0,
      },
      {
        player: homeTeam.players[1],
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 1,
        assists: 2,
      },
      {
        player: homeTeam.players[2],
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 1,
      },
      {
        player: homeTeam.players[3],
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 0,
        assists: 0,
      },
      {
        player: homeTeam.players[4],
        team: 'home' as const,
        teamName: 'Barcelona',
        goals: 1,
        assists: 1,
      },
      {
        player: awayTeam.players[0],
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: awayTeam.players[1],
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: awayTeam.players[2],
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: awayTeam.players[3],
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
      {
        player: awayTeam.players[4],
        team: 'away' as const,
        teamName: 'Real Madrid',
        goals: 0,
        assists: 0,
      },
    ],
  },
};
