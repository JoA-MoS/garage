import { Clock, Play, Pause } from 'lucide-react';

import { formatTime } from '../../utils';

export interface GameHeaderProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameTime: number;
  isGameRunning: boolean;
  onToggleGame: () => void;
  onGoalClick: (team: 'home' | 'away') => void;
  onResetGame?: () => void;
  onSaveAndNewGame?: () => Promise<void>;
}

export const GameHeader = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  gameTime,
  isGameRunning,
  onToggleGame,
  onGoalClick,
}: GameHeaderProps) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {homeTeamName} vs {awayTeamName}
        </h1>
      </div>

      <div className="mb-6 flex items-center justify-center">
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-blue-600">
              {homeScore}
            </div>
            <div className="mb-3 text-lg font-semibold text-gray-800">
              {homeTeamName.toUpperCase()}
            </div>
            <button
              onClick={() => onGoalClick('home')}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              + Goal
            </button>
          </div>

          <div className="text-2xl font-bold text-gray-400">VS</div>

          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-red-600">
              {awayScore}
            </div>
            <div className="mb-3 text-lg font-semibold text-gray-800">
              {awayTeamName.toUpperCase()}
            </div>
            <button
              onClick={() => onGoalClick('away')}
              className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition-colors hover:bg-red-600"
            >
              + Goal
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2 rounded-lg bg-blue-100 px-3 py-1">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="font-mono text-lg font-semibold text-blue-800">
            {formatTime(gameTime)}
          </span>
        </div>
        <button
          onClick={onToggleGame}
          className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium ${
            isGameRunning
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isGameRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isGameRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
};
