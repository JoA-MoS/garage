import { Clock, Play, Pause } from 'lucide-react';

import { formatTime } from '../../utils';

interface GameHeaderPresentationProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  gameTime: number;
  isGameRunning: boolean;
  onToggleGame: () => void;
  onGoalClick: (team: 'home' | 'away') => void;
  onResetGame: () => void;
  onSaveAndNewGame?: () => Promise<void>;
}

export const GameHeaderPresentation = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  gameTime,
  isGameRunning,
  onToggleGame,
  onGoalClick,
}: GameHeaderPresentationProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          {homeTeamName} vs {awayTeamName}
        </h1>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {homeScore}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-3">
              {homeTeamName.toUpperCase()}
            </div>
            <button
              onClick={() => onGoalClick('home')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Goal
            </button>
          </div>

          <div className="text-2xl font-bold text-gray-400">VS</div>

          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {awayScore}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-3">
              {awayTeamName.toUpperCase()}
            </div>
            <button
              onClick={() => onGoalClick('away')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Goal
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center space-x-4">
        <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-mono text-lg font-semibold text-blue-800">
            {formatTime(gameTime)}
          </span>
        </div>
        <button
          onClick={onToggleGame}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
            isGameRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isGameRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isGameRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
};
