import { GameHeader } from './GameHeader';

const meta = {
  title: 'Components/GameHeader',
  component: GameHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onToggleGame: { action: 'game toggled' },
    onGoalClick: { action: 'goal clicked' },
    onResetGame: { action: 'game reset' },
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
