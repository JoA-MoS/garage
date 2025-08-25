import { Settings, Plus, Trash2 } from 'lucide-react';

import { GameConfig, Team, Player } from '../types';

import { TeamEntry } from './TeamEntry';

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
    return (
      gameConfig.homeTeamName.trim() !== '' &&
      gameConfig.awayTeamName.trim() !== '' &&
      homeTeam.players.length > 0 &&
      awayTeam.players.length > 0 &&
      homeTeam.players.every((p) => p.name.trim() !== '') &&
      awayTeam.players.every((p) => p.name.trim() !== '')
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Game Setup</h3>
        <p className="text-blue-600 text-sm">
          Configure your teams and players before starting the game. Add players
          with their names and jersey numbers.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Player Positions
          </label>
          <button
            onClick={addPosition}
            className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            <Plus className="w-4 h-4" />
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
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Position name"
              />
              {gameConfig.positions.length > 1 && (
                <button
                  onClick={() => removePosition(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-600">
            Home Team
          </h3>
          <TeamEntry
            teamName={gameConfig.homeTeamName}
            players={homeTeam.players}
            positions={gameConfig.positions}
            onTeamNameChange={updateHomeTeamName}
            onPlayersChange={updateHomePlayers}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-red-600">Away Team</h3>
          <TeamEntry
            teamName={gameConfig.awayTeamName}
            players={awayTeam.players}
            positions={gameConfig.positions}
            onTeamNameChange={updateAwayTeamName}
            onPlayersChange={updateAwayPlayers}
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Game Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>
              <strong>Home Team:</strong> {gameConfig.homeTeamName || 'Not set'}
            </p>
            <p>
              <strong>Home Players:</strong> {homeTeam.players.length}
            </p>
            <p>
              <strong>Home Starters:</strong>{' '}
              {homeTeam.players.filter((p) => p.isOnField).length}
            </p>
          </div>
          <div>
            <p>
              <strong>Away Team:</strong> {gameConfig.awayTeamName || 'Not set'}
            </p>
            <p>
              <strong>Away Players:</strong> {awayTeam.players.length}
            </p>
            <p>
              <strong>Away Starters:</strong>{' '}
              {awayTeam.players.filter((p) => p.isOnField).length}
            </p>
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
          className={`flex-1 px-6 py-3 rounded-lg font-medium ${
            canStartGame()
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Start Game
        </button>
        <button
          onClick={() => {
            setGameConfig(defaultGameConfig);
          }}
          className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
        >
          Reset to Defaults
        </button>
      </div>

      {!canStartGame() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            <strong>To start the game:</strong> Both teams need names and at
            least one player with a name.
          </p>
        </div>
      )}
    </div>
  );
};
