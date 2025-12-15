import { Plus, Trash2 } from 'lucide-react';

import { GameConfig, Team, Player } from '../types';

import { TeamEntry } from './team-entry';

interface ConfigTabProps {
  gameConfig: GameConfig;
  homeTeam: Team;
  awayTeam: Team;
  setGameConfig: (config: GameConfig) => void;
  onTeamChange: (team: 'home' | 'away', updatedTeam: Team) => void;
  startGame: () => void;
  defaultGameConfig: GameConfig;
  addPosition: () => void;
  removePosition: (index: number) => void;
  updatePosition: (index: number, value: string) => void;
  loadTestData: (size?: 'full' | 'small' | '9v9' | '7v7') => void;
  clearTeams: () => void;
}

export const ConfigTab = ({
  gameConfig,
  homeTeam,
  awayTeam,
  setGameConfig,
  onTeamChange,
  startGame,
  defaultGameConfig,
  addPosition,
  removePosition,
  updatePosition,
  loadTestData,
  clearTeams,
}: ConfigTabProps) => {
  const updateHomeTeamName = (name: string) => {
    const updatedConfig = { ...gameConfig, homeTeamName: name };
    setGameConfig(updatedConfig);

    const updatedTeam = {
      ...homeTeam,
      name,
      players: homeTeam.players.map((p) => ({ ...p, team: 'home' as const })),
    };
    onTeamChange('home', updatedTeam);
  };

  const updateAwayTeamName = (name: string) => {
    const updatedConfig = { ...gameConfig, awayTeamName: name };
    setGameConfig(updatedConfig);

    const updatedTeam = {
      ...awayTeam,
      name,
      players: awayTeam.players.map((p) => ({ ...p, team: 'away' as const })),
    };
    onTeamChange('away', updatedTeam);
  };

  const updateHomePlayers = (players: Player[]) => {
    const updatedTeam = {
      ...homeTeam,
      players: players.map((p) => ({ ...p, team: 'home' as const })),
    };
    onTeamChange('home', updatedTeam);
  };

  const updateAwayPlayers = (players: Player[]) => {
    const updatedTeam = {
      ...awayTeam,
      players: players.map((p) => ({ ...p, team: 'away' as const })),
    };
    onTeamChange('away', updatedTeam);
  };

  const canStartGame = () => {
    // Basic team names are always required
    if (
      gameConfig.homeTeamName.trim() === '' ||
      gameConfig.awayTeamName.trim() === ''
    ) {
      return false;
    }

    // For teams with detailed tracking, require players with names
    if (gameConfig.homeTeamDetailedTracking) {
      if (
        homeTeam.players.length === 0 ||
        !homeTeam.players.every((p) => p.name.trim() !== '')
      ) {
        return false;
      }
    }

    if (gameConfig.awayTeamDetailedTracking) {
      if (
        awayTeam.players.length === 0 ||
        !awayTeam.players.every((p) => p.name.trim() !== '')
      ) {
        return false;
      }
    }

    return true;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-800">Game Setup</h3>
        <p className="text-sm text-blue-600">
          Configure your teams and players before starting the game. Add players
          with their names and jersey numbers.
        </p>
      </div>

      {/* Test Data Controls */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="mb-3 font-semibold text-yellow-800">
          Quick Setup with Test Data
        </h3>
        <p className="mb-3 text-sm text-yellow-700">
          Skip manual setup and use pre-populated teams for quick testing.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadTestData('full')}
            className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
          >
            Load 11v11 Teams (Barcelona vs Real Madrid)
          </button>
          <button
            onClick={() => loadTestData('9v9')}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Load 9v9 Teams (Eagles vs Lions)
          </button>
          <button
            onClick={() => loadTestData('7v7')}
            className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
          >
            Load 7v7 Teams (Sharks vs Tigers)
          </button>
          <button
            onClick={() => loadTestData('small')}
            className="rounded-md bg-yellow-400 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500"
          >
            Load 5v5 Teams (City vs United)
          </button>
          <button
            onClick={clearTeams}
            className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
          >
            Clear All Teams
          </button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Player Positions
          </label>
          <button
            onClick={addPosition}
            className="flex items-center space-x-1 rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add Position</span>
          </button>
        </div>

        <div className="space-y-2">
          {gameConfig.positions.map((position: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={position}
                onChange={(e) => updatePosition(index, e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Position name"
              />
              {gameConfig.positions.length > 1 && (
                <button
                  onClick={() => removePosition(index)}
                  className="rounded bg-red-500 p-2 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Team Tracking Settings */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-3 font-semibold text-amber-800">
          Team Tracking Mode
        </h3>
        <p className="mb-4 text-sm text-amber-700">
          Choose detailed tracking for your own team and simplified tracking for
          opponents. Detailed tracking includes full player management, while
          simplified tracking only records jersey numbers for goals.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="homeTeamTracking"
              checked={gameConfig.homeTeamDetailedTracking}
              onChange={(e) => {
                const newConfig = {
                  ...gameConfig,
                  homeTeamDetailedTracking: e.target.checked,
                };
                setGameConfig(newConfig);
                const updatedTeam = {
                  ...homeTeam,
                  isDetailedTracking: e.target.checked,
                };
                onTeamChange('home', updatedTeam);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="homeTeamTracking"
              className="text-sm font-medium text-gray-700"
            >
              Detailed tracking for {gameConfig.homeTeamName || 'Home Team'}
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="awayTeamTracking"
              checked={gameConfig.awayTeamDetailedTracking}
              onChange={(e) => {
                const newConfig = {
                  ...gameConfig,
                  awayTeamDetailedTracking: e.target.checked,
                };
                setGameConfig(newConfig);
                const updatedTeam = {
                  ...awayTeam,
                  isDetailedTracking: e.target.checked,
                };
                onTeamChange('away', updatedTeam);
              }}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label
              htmlFor="awayTeamTracking"
              className="text-sm font-medium text-gray-700"
            >
              Detailed tracking for {gameConfig.awayTeamName || 'Away Team'}
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-blue-600">
            Home Team
          </h3>
          {gameConfig.homeTeamDetailedTracking ? (
            <TeamEntry
              teamName={gameConfig.homeTeamName}
              players={homeTeam.players}
              positions={gameConfig.positions}
              onTeamNameChange={updateHomeTeamName}
              onPlayersChange={updateHomePlayers}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Team Name
                </label>
                <input
                  type="text"
                  value={gameConfig.homeTeamName}
                  onChange={(e) => updateHomeTeamName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Simplified Tracking:</strong> Only jersey numbers will
                  be recorded for goals and assists. No detailed player
                  management is needed.
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-600">Away Team</h3>
          {gameConfig.awayTeamDetailedTracking ? (
            <TeamEntry
              teamName={gameConfig.awayTeamName}
              players={awayTeam.players}
              positions={gameConfig.positions}
              onTeamNameChange={updateAwayTeamName}
              onPlayersChange={updateAwayPlayers}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Team Name
                </label>
                <input
                  type="text"
                  value={gameConfig.awayTeamName}
                  onChange={(e) => updateAwayTeamName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                  placeholder="Enter team name"
                />
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  <strong>Simplified Tracking:</strong> Only jersey numbers will
                  be recorded for goals and assists. No detailed player
                  management is needed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 font-medium text-gray-800">Game Summary</h4>
        <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
          <div>
            <p>
              <strong>Home Team:</strong> {gameConfig.homeTeamName || 'Not set'}
            </p>
            <p>
              <strong>Tracking Mode:</strong>{' '}
              {gameConfig.homeTeamDetailedTracking ? 'Detailed' : 'Simplified'}
            </p>
            {gameConfig.homeTeamDetailedTracking && (
              <>
                <p>
                  <strong>Home Players:</strong> {homeTeam.players.length}
                </p>
                <p>
                  <strong>Home Starters:</strong>{' '}
                  {homeTeam.players.filter((p) => p.isOnField).length}
                </p>
              </>
            )}
          </div>
          <div>
            <p>
              <strong>Away Team:</strong> {gameConfig.awayTeamName || 'Not set'}
            </p>
            <p>
              <strong>Tracking Mode:</strong>{' '}
              {gameConfig.awayTeamDetailedTracking ? 'Detailed' : 'Simplified'}
            </p>
            {gameConfig.awayTeamDetailedTracking && (
              <>
                <p>
                  <strong>Away Players:</strong> {awayTeam.players.length}
                </p>
                <p>
                  <strong>Away Starters:</strong>{' '}
                  {awayTeam.players.filter((p) => p.isOnField).length}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="mt-2">
          <p>
            <strong>Positions:</strong> {gameConfig.positions.join(', ')}
          </p>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={startGame}
          disabled={!canStartGame()}
          className={`flex-1 rounded-lg px-6 py-3 font-medium ${
            canStartGame()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
        >
          Start Game
        </button>
        <button
          onClick={() => {
            setGameConfig(defaultGameConfig);
          }}
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-600 hover:bg-gray-50"
        >
          Reset to Defaults
        </button>
      </div>

      {!canStartGame() && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            <strong>To start the game:</strong> Both teams need names and at
            least one player with a name.
          </p>
        </div>
      )}
    </div>
  );
};
