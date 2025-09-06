import { TeamStatsCardPresentation } from './team-stats-card.presentation';

const meta = {
  title: 'Components/Presentation/TeamStatsCard',
  component: TeamStatsCardPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    teamType: {
      control: 'select',
      options: ['home', 'away'],
    },
    goals: {
      control: { type: 'number', min: 0, max: 10 },
    },
    assists: {
      control: { type: 'number', min: 0, max: 10 },
    },
    playersOnField: {
      control: { type: 'number', min: 0, max: 11 },
    },
  },
};

export default meta;

const sampleHomeTeam = {
  name: 'Barcelona',
  players: [],
  goals: [],
};

const sampleAwayTeam = {
  name: 'Real Madrid',
  players: [],
  goals: [],
};

export const HomeTeam = {
  args: {
    team: sampleHomeTeam,
    teamType: 'home',
    goals: 3,
    assists: 2,
    playersOnField: 11,
  },
};

export const AwayTeam = {
  args: {
    team: sampleAwayTeam,
    teamType: 'away',
    goals: 2,
    assists: 3,
    playersOnField: 11,
  },
};

export const HighScoring = {
  args: {
    team: { ...sampleHomeTeam, name: 'Manchester City' },
    teamType: 'home',
    goals: 6,
    assists: 5,
    playersOnField: 11,
  },
};

export const NoGoals = {
  args: {
    team: { ...sampleAwayTeam, name: 'Atletico Madrid' },
    teamType: 'away',
    goals: 0,
    assists: 0,
    playersOnField: 11,
  },
};

export const WithSubstitutions = {
  args: {
    team: { ...sampleHomeTeam, name: 'Bayern Munich' },
    teamType: 'home',
    goals: 2,
    assists: 1,
    playersOnField: 9, // Some players substituted
  },
};

export const LongTeamName = {
  args: {
    team: { ...sampleHomeTeam, name: 'Borussia Mönchengladbach' },
    teamType: 'home',
    goals: 1,
    assists: 2,
    playersOnField: 11,
  },
};

export const ShortTeamName = {
  args: {
    team: { ...sampleAwayTeam, name: 'PSG' },
    teamType: 'away',
    goals: 4,
    assists: 3,
    playersOnField: 10,
  },
};
