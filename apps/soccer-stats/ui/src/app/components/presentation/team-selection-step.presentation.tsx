import { useState } from 'react';
import { Plus, Home, Users } from 'lucide-react';

import { Team } from '../../services/teams-graphql.service';
// import { SelectedTeams } from '../smart/game-setup-wizard.smart';

interface TeamSelectionStepProps {
  // selectedTeams: SelectedTeams;
  managedTeams: Team[];
  isLoading: boolean;
  onSelectManagedTeam: (team: Team, side: 'home' | 'away') => void;
  onCreateOpponentTeam: (teamName: string, shortName?: string) => Promise<void>;
}

export const TeamSelectionStep = ({
  // selectedTeams,
  managedTeams,
  isLoading,
  onSelectManagedTeam,
  onCreateOpponentTeam,
}: TeamSelectionStepProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortName, setNewTeamShortName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setCreatingTeam(true);
    try {
      await onCreateOpponentTeam(newTeamName, newTeamShortName || undefined);
      setNewTeamName('');
      setNewTeamShortName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setCreatingTeam(false);
    }
  };

  const TeamCard = ({ team, side }: { team: Team; side: 'home' | 'away' }) => (
    <button
      onClick={() => onSelectManagedTeam(team, side)}
      className="
        w-full p-4 border-2 border-gray-200 rounded-lg text-left
        transition-all duration-200

        /* Mobile touch-friendly sizing */
        min-h-[80px]

        /* Hover and selected states */
        hover:border-blue-300 hover:bg-blue-50
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

        /* Active/pressed state for mobile */
        active:scale-95
      "
    >
      <div className="flex items-center space-x-3">
        <div
          className="
            w-10 h-10 rounded-full flex items-center justify-center text-white font-bold

            /* Desktop enhancement */
            lg:w-12 lg:h-12
          "
          style={{ backgroundColor: team.homePrimaryColor || '#3B82F6' }}
        >
          {team.shortName || team.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{team.name}</h3>
          <p className="text-sm text-gray-500">
            {team.isManaged ? 'Your Team' : 'External Team'}
          </p>
        </div>
      </div>
    </button>
  );

  const SelectedTeamDisplay = ({
    team,
    side,
  }: {
    team: Team | null;
    side: 'home' | 'away';
  }) => (
    <div
      className="
      p-4 border-2 border-dashed border-gray-300 rounded-lg

      /* Selected state styling */
      data-[selected=true]:border-solid data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50
    "
      data-selected={!!team}
    >
      {team ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {side === 'home' ? (
              <Home className="w-5 h-5 text-blue-600" />
            ) : (
              <Users className="w-5 h-5 text-gray-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {side === 'home' ? 'Home Team' : 'Away Team'}
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: team.homePrimaryColor || '#3B82F6' }}
          >
            {team.shortName || team.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{team.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          {side === 'home' ? (
            <Home className="w-5 h-5" />
          ) : (
            <Users className="w-5 h-5" />
          )}
          <span>Select {side === 'home' ? 'home' : 'away'} team</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Selected teams display */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Selected Teams</h2>
        <div className="space-y-3">
          {/* <SelectedTeamDisplay team={selectedTeams.homeTeam} side="home" />
          <SelectedTeamDisplay team={selectedTeams.awayTeam} side="away" /> */}
        </div>
      </div>

      {/* Home team selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Select Your Team (Home)
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div
            className="
            grid gap-3

            /* Mobile: single column */
            grid-cols-1

            /* Tablet and up: multiple columns */
            sm:grid-cols-2 lg:grid-cols-3
          "
          >
            {managedTeams.map((team) => (
              <TeamCard key={team.id} team={team} side="home" />
            ))}
          </div>
        )}
      </div>

      {/* Away team selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Select Opponent (Away)
        </h2>

        {/* Create new opponent team */}
        <div className="space-y-3">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="
                w-full p-4 border-2 border-dashed border-gray-300 rounded-lg
                text-gray-600 hover:border-blue-300 hover:text-blue-600
                transition-colors duration-200

                /* Touch-friendly sizing */
                min-h-[80px]

                /* Focus styles */
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              <div className="flex items-center justify-center space-x-2">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create New Opponent Team</span>
              </div>
            </button>
          ) : (
            <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50 space-y-4">
              <h3 className="font-medium text-gray-900">
                Create Opponent Team
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Team Name *
                  </label>
                  <input
                    id="teamName"
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter opponent team name"
                    className="
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500

                      /* Touch-friendly sizing */
                      min-h-[44px]
                    "
                  />
                </div>
                <div>
                  <label
                    htmlFor="teamShortName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Short Name (optional)
                  </label>
                  <input
                    id="teamShortName"
                    type="text"
                    value={newTeamShortName}
                    onChange={(e) => setNewTeamShortName(e.target.value)}
                    placeholder="e.g., ABC"
                    maxLength={3}
                    className="
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500

                      /* Touch-friendly sizing */
                      min-h-[44px]
                    "
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || creatingTeam}
                  className="
                    flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed

                    /* Touch-friendly sizing */
                    min-h-[44px]

                    /* Hover states */
                    hover:bg-blue-700 transition-colors
                  "
                >
                  {creatingTeam ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTeamName('');
                    setNewTeamShortName('');
                  }}
                  className="
                    px-4 py-2 border border-gray-300 text-gray-700 rounded-md
                    hover:bg-gray-50 transition-colors

                    /* Touch-friendly sizing */
                    min-h-[44px]
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
