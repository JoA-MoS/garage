import { Search, Users } from 'lucide-react';
import { useState } from 'react';

import { Player, Team } from '../../types';

interface RosterViewPresentationProps {
  homeTeam: Team;
  awayTeam: Team;
  homeTeamName: string;
  awayTeamName: string;
}

export const RosterViewPresentation = ({
  homeTeam,
  awayTeam,
  homeTeamName,
  awayTeamName,
}: RosterViewPresentationProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTeam, setActiveTeam] = useState<'home' | 'away' | 'both'>(
    'both'
  );

  const filterPlayers = (players: Player[], teamName: string) => {
    return players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.jersey.toString().includes(searchTerm) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getDisplayPlayers = () => {
    const homeFiltered = filterPlayers(homeTeam.players, homeTeamName);
    const awayFiltered = filterPlayers(awayTeam.players, awayTeamName);

    switch (activeTeam) {
      case 'home':
        return [
          { team: 'home', teamName: homeTeamName, players: homeFiltered },
        ];
      case 'away':
        return [
          { team: 'away', teamName: awayTeamName, players: awayFiltered },
        ];
      case 'both':
      default:
        return [
          { team: 'home', teamName: homeTeamName, players: homeFiltered },
          { team: 'away', teamName: awayTeamName, players: awayFiltered },
        ];
    }
  };

  const PlayerRosterCard = ({
    player,
    teamColor,
  }: {
    player: Player;
    teamColor: string;
  }) => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Large Player Photo */}
        <div className="relative">
          {player.photo ? (
            <img
              src={player.photo}
              alt={`${player.name} photo`}
              className="w-32 h-40 rounded-xl object-cover border-4 border-gray-300 shadow-md"
            />
          ) : (
            <div className="w-32 h-40 rounded-xl bg-gray-300 flex flex-col items-center justify-center text-gray-600 border-4 border-gray-400 shadow-md">
              <span className="text-4xl font-bold">#{player.jersey}</span>
              <span className="text-sm mt-2">No Photo</span>
            </div>
          )}
          {/* Jersey Number Badge */}
          <div
            className={`absolute -top-2 -right-2 ${teamColor} text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}
          >
            {player.jersey}
          </div>
        </div>

        {/* Player Info */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-800">{player.name}</h3>
          <p className="text-lg text-gray-600 font-medium">{player.position}</p>
          <div className="flex items-center justify-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                player.isOnField
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {player.isOnField ? '🏃 On Field' : '🪑 Bench'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const displayTeams = getDisplayPlayers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Team Roster</h2>
          </div>

          {/* Team Filter Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTeam('both')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTeam === 'both'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Both Teams
            </button>
            <button
              onClick={() => setActiveTeam('home')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTeam === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {homeTeamName}
            </button>
            <button
              onClick={() => setActiveTeam('away')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTeam === 'away'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {awayTeamName}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, jersey number, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Player Grids */}
      {displayTeams.map(({ team, teamName, players }) => {
        if (players.length === 0) return null;

        const teamColorClass = team === 'home' ? 'bg-blue-600' : 'bg-red-600';
        const headerColorClass =
          team === 'home' ? 'text-blue-700' : 'text-red-700';

        return (
          <div key={team} className="space-y-4">
            {activeTeam === 'both' && (
              <h3
                className={`text-xl font-bold ${headerColorClass} flex items-center`}
              >
                <span
                  className={`w-4 h-4 rounded-full ${teamColorClass} mr-3`}
                ></span>
                {teamName} ({players.length} players)
              </h3>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {players.map((player) => (
                <PlayerRosterCard
                  key={player.id}
                  player={player}
                  teamColor={teamColorClass}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* No Results Message */}
      {displayTeams.every(({ players }) => players.length === 0) && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">No players found</p>
          <p className="text-gray-400">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
};
