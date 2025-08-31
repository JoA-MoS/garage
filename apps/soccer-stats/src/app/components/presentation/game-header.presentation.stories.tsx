import { GameHeaderPresentation } from './game-header.presentation';

const meta = {
  title: 'Components/Presentation/GameHeader',
  component: GameHeaderPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onToggleGame: { action: 'game toggled' },
    onGoalClick: { action: 'goal clicked' },
    onResetGame: { action: 'game reset' },
    isGameRunning: {
      control: 'boolean',
    },
  },
};

export default meta;

export const GameInProgress = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    homeScore: 2,
    awayScore: 1,
    gameTime: 2700, // 45 minutes
    isGameRunning: true,
  },
};

export const GamePaused = {
  args: {
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
    homeScore: 2,
    awayScore: 1,
    gameTime: 2700, // 45 minutes
    isGameRunning: false,
  },
};

export const GameStart = {
  args: {
    homeTeamName: 'Manchester United',
    awayTeamName: 'Liverpool',
    homeScore: 0,
    awayScore: 0,
    gameTime: 0,
    isGameRunning: false,
  },
};

export const HighScoringGame = {
  args: {
    homeTeamName: 'Bayern Munich',
    awayTeamName: 'Borussia Dortmund',
    homeScore: 4,
    awayScore: 3,
    gameTime: 5400, // 90 minutes
    isGameRunning: true,
  },
};

export const CloseGame = {
  args: {
    homeTeamName: 'Arsenal',
    awayTeamName: 'Chelsea',
    homeScore: 1,
    awayScore: 1,
    gameTime: 3600, // 60 minutes
    isGameRunning: true,
  },
};

export const OvertimeGame = {
  args: {
    homeTeamName: 'AC Milan',
    awayTeamName: 'Inter Milan',
    homeScore: 2,
    awayScore: 2,
    gameTime: 6300, // 105 minutes (90 + 15 extra time)
    isGameRunning: true,
  },
};

export const LongTeamNames = {
  args: {
    homeTeamName: 'Manchester United',
    awayTeamName: 'Borussia Dortmund',
    homeScore: 1,
    awayScore: 0,
    gameTime: 1800, // 30 minutes
    isGameRunning: true,
  },
};

export const ShortTeamNames = {
  args: {
    homeTeamName: 'PSG',
    awayTeamName: 'Milan',
    homeScore: 3,
    awayScore: 2,
    gameTime: 4500, // 75 minutes
    isGameRunning: false,
  },
};

export const ZeroZeroGame = {
  args: {
    homeTeamName: 'Atletico Madrid',
    awayTeamName: 'Juventus',
    homeScore: 0,
    awayScore: 0,
    gameTime: 5400, // 90 minutes
    isGameRunning: false,
  },
};

export const BlowoutGame = {
  args: {
    homeTeamName: 'Manchester City',
    awayTeamName: 'Watford',
    homeScore: 8,
    awayScore: 0,
    gameTime: 5400, // 90 minutes
    isGameRunning: false,
  },
};
