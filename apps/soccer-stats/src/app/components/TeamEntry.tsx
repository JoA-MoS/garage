import { Plus, X } from 'lucide-react';

import { Player } from '../types';

interface TeamEntryProps {
  teamName: string;
  players: Player[];
  positions: string[];
  onTeamNameChange: (name: string) => void;
  onPlayersChange: (players: Player[]) => void;
}

export const TeamEntry = ({
  teamName,
  players,
  positions,
  onTeamNameChange,
  onPlayersChange,
}: TeamEntryProps) => {
  const addPlayer = () => {
    const newId = Math.max(0, ...players.map((p) => p.id)) + 1;
    const newPlayer: Player = {
      id: newId,
      name: '',
      jersey: getNextAvailableJersey(),
      position: positions[0] || 'Player',
      goals: 0,
      assists: 0,
      playTime: 0,
      isOnField: players.length < 11, // First 11 players start on field
      team: teamName.toLowerCase() as 'home' | 'away',
    };
    onPlayersChange([...players, newPlayer]);
  };

  const removePlayer = (playerId: number) => {
    onPlayersChange(players.filter((p) => p.id !== playerId));
  };

  const updatePlayer = (playerId: number, field: keyof Player, value: any) => {
    onPlayersChange(
      players.map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player
      )
    );
  };

  const getNextAvailableJersey = (): number => {
    const usedNumbers = new Set(players.map((p) => p.jersey));
    for (let i = 1; i <= 99; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }
    return 1;
  };

  const isJerseyTaken = (jersey: number, currentPlayerId: number): boolean => {
    return players.some((p) => p.jersey === jersey && p.id !== currentPlayerId);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Name
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter team name"
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-medium text-gray-800">Players</h4>
          <button
            onClick={addPlayer}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Player
          </button>
        </div>

        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No players added yet. Click "Add Player" to start building your
            team.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                  player.isOnField
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {index + 1}.
                  </span>
                </div>

                <div className="w-20">
                  <input
                    type="number"
                    value={player.jersey}
                    onChange={(e) => {
                      const jersey = parseInt(e.target.value) || 1;
                      updatePlayer(player.id, 'jersey', jersey);
                    }}
                    min="1"
                    max="99"
                    className={`w-full px-2 py-1 text-center border rounded focus:outline-none focus:ring-1 ${
                      isJerseyTaken(player.jersey, player.id)
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="#"
                  />
                  {isJerseyTaken(player.jersey, player.id) && (
                    <p className="text-xs text-red-500 mt-1">Number taken</p>
                  )}
                </div>

                <div className="flex-grow">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) =>
                      updatePlayer(player.id, 'name', e.target.value)
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Player name"
                  />
                </div>

                <div className="w-32">
                  <select
                    value={player.position}
                    onChange={(e) =>
                      updatePlayer(player.id, 'position', e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {positions.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-shrink-0">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={player.isOnField}
                      onChange={(e) =>
                        updatePlayer(player.id, 'isOnField', e.target.checked)
                      }
                      className="mr-2"
                    />
                    Starting
                  </label>
                </div>

                <button
                  onClick={() => removePlayer(player.id)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                  title="Remove player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>
              Players on field: {players.filter((p) => p.isOnField).length}
            </span>
            <span>Total players: {players.length}</span>
          </div>
          {players.filter((p) => p.isOnField).length > 11 && (
            <p className="text-red-500 text-xs mt-1">
              Warning: More than 11 players marked as starting
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
