import { useState } from 'react';
import { Plus, Users } from 'lucide-react';

import { SelectedTeams } from '../smart/game-setup-wizard.smart';
import { Player, TeamPlayer } from '../../services/players-graphql.service';

interface PlayerAssignmentStepProps {
  selectedTeams: SelectedTeams;
  availablePlayers: Player[];
  isLoading: boolean;
  onCreatePlayerForTeam: (
    teamId: string,
    firstName: string,
    lastName: string,
    jerseyNumber: number
  ) => Promise<void>;
  onUpdatePlayers: (players: Record<string, unknown>) => void;
}

export const PlayerAssignmentStep = ({
  selectedTeams,
  availablePlayers,
  isLoading,
  onCreatePlayerForTeam,
  onUpdatePlayers,
}: PlayerAssignmentStepProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');

  const handleCreatePlayerForActiveTeam = async (
    firstName: string,
    lastName: string,
    jerseyNumber: number
  ) => {
    const selectedTeam =
      activeTeam === 'home' ? selectedTeams.homeTeam : selectedTeams.awayTeam;
    if (!selectedTeam) return;

    try {
      await onCreatePlayerForTeam(
        selectedTeam.id,
        firstName,
        lastName,
        jerseyNumber
      );
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create player:', error);
    }
  };

  const getTeamPlayers = (teamId: string) => {
    return availablePlayers.filter((player) =>
      player.teamPlayers?.some((tp: TeamPlayer) => tp.team.id === teamId)
    );
  };

  const getAvailablePlayers = () => {
    const selectedTeam =
      activeTeam === 'home' ? selectedTeams.homeTeam : selectedTeams.awayTeam;
    if (!selectedTeam) return [];

    // For managed teams, show all players not already on this team
    if (selectedTeam.isManaged) {
      return availablePlayers.filter(
        (player) =>
          !player.teamPlayers?.some(
            (tp: TeamPlayer) => tp.team.id === selectedTeam.id
          )
      );
    }

    // For unmanaged teams, show all players
    return availablePlayers;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Add Players to Teams
        </h2>
        <p className="text-gray-600">
          Assign players to {selectedTeams.homeTeam?.name} and{' '}
          {selectedTeams.awayTeam?.name}
        </p>
      </div>

      {/* Team Selection Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTeam('home')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTeam === 'home'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          {selectedTeams.homeTeam?.name || 'Home Team'}
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTeam === 'away'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          {selectedTeams.awayTeam?.name || 'Away Team'}
        </button>
      </div>

      {/* Current Team Players */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Current Players</h3>
        {(() => {
          const selectedTeam =
            activeTeam === 'home'
              ? selectedTeams.homeTeam
              : selectedTeams.awayTeam;
          if (!selectedTeam) return null;

          const teamPlayers = getTeamPlayers(selectedTeam.id);

          if (teamPlayers.length === 0) {
            return (
              <p className="text-gray-500 text-sm italic">
                No players assigned yet
              </p>
            );
          }

          return (
            <div className="space-y-2">
              {teamPlayers.map((player) => {
                const teamPlayer = player.teamPlayers?.find(
                  (tp: TeamPlayer) => tp.team.id === selectedTeam.id
                );
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                      {teamPlayer?.jerseyNumber && (
                        <span className="ml-2 text-sm text-gray-600">
                          #{teamPlayer.jerseyNumber}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Team Players Display */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Home Team */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{selectedTeams.homeTeam?.name}</span>
              <span className="text-sm text-gray-500">(Home)</span>
            </h3>
            <button
              onClick={() => {
                setActiveTeam('home');
                setShowCreateForm(true);
              }}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Player
            </button>
          </div>

          {selectedTeams.homeTeam && (
            <div className="space-y-2">
              {getTeamPlayers(selectedTeams.homeTeam.id).map((player) => {
                const teamPlayer = player.teamPlayers?.find(
                  (tp: TeamPlayer) => tp.team.id === selectedTeams.homeTeam?.id
                );
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                      {teamPlayer?.jerseyNumber && (
                        <span className="ml-2 text-sm text-gray-600">
                          #{teamPlayer.jerseyNumber}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {getTeamPlayers(selectedTeams.homeTeam.id).length === 0 && (
                <p className="text-gray-500 text-sm italic">
                  No players added yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{selectedTeams.awayTeam?.name}</span>
              <span className="text-sm text-gray-500">(Away)</span>
            </h3>
            <button
              onClick={() => {
                setActiveTeam('away');
                setShowCreateForm(true);
              }}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Player
            </button>
          </div>

          {selectedTeams.awayTeam && (
            <div className="space-y-2">
              {getTeamPlayers(selectedTeams.awayTeam.id).map((player) => {
                const teamPlayer = player.teamPlayers?.find(
                  (tp: TeamPlayer) => tp.team.id === selectedTeams.awayTeam?.id
                );
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium">
                        {player.firstName} {player.lastName}
                      </span>
                      {teamPlayer?.jerseyNumber && (
                        <span className="ml-2 text-sm text-gray-600">
                          #{teamPlayer.jerseyNumber}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {getTeamPlayers(selectedTeams.awayTeam.id).length === 0 && (
                <p className="text-gray-500 text-sm italic">
                  No players added yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create New Player Form */}
      {showCreateForm && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Create New Player for{' '}
            {activeTeam === 'home'
              ? selectedTeams.homeTeam?.name
              : selectedTeams.awayTeam?.name}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const firstName = formData.get('firstName') as string;
              const lastName = formData.get('lastName') as string;
              const jerseyNumber = parseInt(
                formData.get('jerseyNumber') as string
              );

              if (firstName && lastName && jerseyNumber) {
                handleCreatePlayerForActiveTeam(
                  firstName,
                  lastName,
                  jerseyNumber
                );
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <input
                name="firstName"
                type="text"
                placeholder="First Name"
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="lastName"
                type="text"
                placeholder="Last Name"
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="jerseyNumber"
                type="number"
                placeholder="Jersey #"
                min="1"
                max="99"
                required
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Player
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
