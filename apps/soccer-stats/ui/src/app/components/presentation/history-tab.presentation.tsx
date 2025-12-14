import {
  Calendar,
  Download,
  Trash2,
  Trophy,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { GameResult, SeasonStats } from '../../services/game-history.service';

interface HistoryTabPresentationProps {
  gameHistory: GameResult[];
  seasonStats: SeasonStats[];
  isLoading: boolean;
  onDeleteGame: (gameId: string) => void;
  onExportGame: (gameId: string) => void;
  onExportSeason: () => void;
  onClearAllData: () => void;
  getTeamAnalytics: () => {
    winLossRecord: { wins: number; losses: number; draws: number };
    averageScore: number;
    topScorers: { name: string; goals: number }[];
    topAssists: { name: string; assists: number }[];
  };
}

export const HistoryTabPresentation = ({
  gameHistory,
  seasonStats,
  isLoading,
  onDeleteGame,
  onExportGame,
  onExportSeason,
  onClearAllData,
  getTeamAnalytics,
}: HistoryTabPresentationProps) => {
  const [activeView, setActiveView] = useState<
    'games' | 'season' | 'analytics'
  >('games');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  const analytics = getTeamAnalytics();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            Game History & Analytics
          </h2>

          <div className="flex space-x-2">
            <button
              onClick={onExportSeason}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Season</span>
            </button>
            {gameHistory.length > 0 && (
              <button
                onClick={onClearAllData}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('games')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeView === 'games'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Game History ({gameHistory.length})
          </button>
          <button
            onClick={() => setActiveView('season')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeView === 'season'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Season Stats
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeView === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content Based on Active View */}
      {activeView === 'games' && (
        <div className="space-y-4">
          {gameHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No games played yet</p>
              <p className="text-gray-400">Complete a game to see it here</p>
            </div>
          ) : (
            gameHistory.map((game) => (
              <div key={game.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {game.homeTeam.name} vs {game.awayTeam.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(game.date)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {game.homeTeam.score} - {game.awayTeam.score}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDuration(game.duration)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onExportGame(game.id)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(game.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Game Stats Summary */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      {game.homeTeam.name}
                    </h4>
                    <div className="space-y-1 text-gray-600">
                      <p>
                        Goals:{' '}
                        {game.goals.filter((g) => g.team === 'home').length}
                      </p>
                      <p>Players: {game.homeTeam.players.length}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      {game.awayTeam.name}
                    </h4>
                    <div className="space-y-1 text-gray-600">
                      <p>
                        Goals:{' '}
                        {game.goals.filter((g) => g.team === 'away').length}
                      </p>
                      <p>Players: {game.awayTeam.players.length}</p>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === game.id && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-800 mb-3">
                      Are you sure you want to delete this game? This action
                      cannot be undone.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          onDeleteGame(game.id);
                          setShowDeleteConfirm(null);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeView === 'season' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {seasonStats.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No season data yet</p>
              <p className="text-gray-400">
                Play some games to see season statistics
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Player
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Games
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Avg Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Goals
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Assists
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Total Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((stat) => (
                    <tr
                      key={stat.playerId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {stat.photo ? (
                            <img
                              src={stat.photo}
                              alt={`${stat.name} photo`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                              #{stat.jersey}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              #{stat.jersey} {stat.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {stat.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {stat.gamesPlayed}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {formatDuration(stat.averagePlayTime)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                        {stat.totalGoals}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                        {stat.totalAssists}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {formatDuration(stat.totalPlayTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          {gameHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">No analytics data yet</p>
              <p className="text-gray-400">
                Play some games to see performance analytics
              </p>
            </div>
          ) : (
            <>
              {/* Team Analytics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
                  Team Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics.winLossRecord.wins}
                    </div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.winLossRecord.losses}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {analytics.winLossRecord.draws}
                    </div>
                    <div className="text-sm text-gray-600">Draws</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics.averageScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Top Scorers
                  </h3>
                  <div className="space-y-3">
                    {analytics.topScorers.map((scorer, index) => (
                      <div
                        key={scorer.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">
                            {scorer.name}
                          </span>
                        </div>
                        <span className="font-bold text-blue-600">
                          {scorer.goals}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Top Assists
                  </h3>
                  <div className="space-y-3">
                    {analytics.topAssists.map((assist, index) => (
                      <div
                        key={assist.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">
                            {assist.name}
                          </span>
                        </div>
                        <span className="font-bold text-purple-600">
                          {assist.assists}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
