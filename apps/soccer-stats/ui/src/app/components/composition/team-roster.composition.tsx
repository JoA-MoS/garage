import { useState, useCallback } from 'react';
// import { useQuery } from '@apollo/client';

import {
  GET_USERS_BY_TEAM,
  GET_PLAYERS_BY_TEAM,
  GET_COACHES_BY_TEAM,
  User,
} from '../../services/users-graphql.service';

interface TeamRosterCompositionProps {
  teamId: string;
  teamName?: string;
  showSeparateSections?: boolean; // Whether to separate players and coaches into different sections
}

export const TeamRosterComposition = ({
  teamId,
  teamName = 'Team',
  showSeparateSections = false,
}: TeamRosterCompositionProps) => {
  // =================================
  // QUERY STRATEGY
  // =================================

  // Strategy 1: Single unified query (RECOMMENDED)
  // Gets all team members (players + coaches) in one request
  // TODO: Uncomment when GraphQL is connected
  // const { data, loading, error } = useQuery(GET_USERS_BY_TEAM, {
  //   variables: { teamId }
  // });

  // Strategy 2: Separate queries (if you need separate loading states)
  // const { data: playersData, loading: playersLoading } = useQuery(GET_PLAYERS_BY_TEAM, {
  //   variables: { teamId }
  // });
  // const { data: coachesData, loading: coachesLoading } = useQuery(GET_COACHES_BY_TEAM, {
  //   variables: { teamId }
  // });

  const [isLoading] = useState(false);

  // =================================
  // ENHANCED MOCK DATA FOR TEAM ROSTER
  // =================================

  const mockTeamMembers: Partial<User>[] = [
    // Players
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      teamPlayers: [
        {
          id: 'tp1',
          jerseyNumber: '10',
          primaryPosition: 'Forward',
          joinedDate: new Date('2023-01-15'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
      teamCoaches: [],
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@example.com',
      teamPlayers: [
        {
          id: 'tp2',
          jerseyNumber: '1',
          primaryPosition: 'Goalkeeper',
          joinedDate: new Date('2023-01-15'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
      teamCoaches: [],
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      teamPlayers: [
        {
          id: 'tp3',
          jerseyNumber: '8',
          primaryPosition: 'Midfielder',
          joinedDate: new Date('2023-02-01'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
      teamCoaches: [
        {
          id: 'tc1',
          role: 'Player-Coach',
          startDate: new Date('2023-06-01'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
    },

    // Coaches
    {
      id: '4',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      teamPlayers: [],
      teamCoaches: [
        {
          id: 'tc2',
          role: 'Head Coach',
          startDate: new Date('2022-08-01'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
    },
    {
      id: '5',
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'robert.brown@example.com',
      teamPlayers: [],
      teamCoaches: [
        {
          id: 'tc3',
          role: 'Assistant Coach',
          startDate: new Date('2023-01-01'),
          isActive: true,
          team: { id: teamId, name: teamName, shortName: 'TFC' },
        },
      ],
    },
  ];

  // =================================
  // DATA PROCESSING
  // =================================

  const players = mockTeamMembers.filter(
    (user) => user.teamPlayers && user.teamPlayers.length > 0
  );

  const coaches = mockTeamMembers.filter(
    (user) => user.teamCoaches && user.teamCoaches.length > 0
  );

  const playersOnly = players.filter(
    (user) => !user.teamCoaches || user.teamCoaches.length === 0
  );

  const coachesOnly = coaches.filter(
    (user) => !user.teamPlayers || user.teamPlayers.length === 0
  );

  const playerCoaches = mockTeamMembers.filter(
    (user) =>
      user.teamPlayers &&
      user.teamPlayers.length > 0 &&
      user.teamCoaches &&
      user.teamCoaches.length > 0
  );

  // =================================
  // EVENT HANDLERS
  // =================================

  const handleEditMember = useCallback((userId: string) => {
    console.log('Edit team member:', userId);
  }, []);

  const handleRemoveFromTeam = useCallback(
    (userId: string, role: 'player' | 'coach') => {
      console.log('Remove from team:', userId, 'as', role);
      // TODO: Call removePlayerFromTeam or removeCoachFromTeam mutation
    },
    []
  );

  const handleChangeJerseyNumber = useCallback(
    (userId: string, newNumber: string) => {
      console.log('Change jersey number for:', userId, 'to:', newNumber);
      // TODO: Call mutation to update jersey number
    },
    []
  );

  // =================================
  // RENDER COMPONENTS
  // =================================

  const renderPlayerCard = (user: Partial<User>) => {
    const playerInfo = user.teamPlayers![0]; // We know it exists from filter

    return (
      <div
        key={`${user.id}-player`}
        className="
        rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow-md
        transition-all duration-200 hover:shadow-lg
      "
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Jersey Number */}
            <div
              className="
              flex h-12 w-12 items-center justify-center 
              rounded-full bg-blue-600 text-lg font-bold text-white
            "
            >
              {playerInfo.jerseyNumber || '?'}
            </div>

            {/* Player Info */}
            <div>
              <h3 className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600">
                {playerInfo.primaryPosition}
              </p>
              <p className="text-xs text-gray-500">
                Joined: {playerInfo.joinedDate?.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleEditMember(user.id!)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleRemoveFromTeam(user.id!, 'player')}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Show if player is also a coach */}
        {user.teamCoaches && user.teamCoaches.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Also: {user.teamCoaches[0].role}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderCoachCard = (user: Partial<User>) => {
    const coachInfo = user.teamCoaches![0]; // We know it exists from filter

    return (
      <div
        key={`${user.id}-coach`}
        className="
        rounded-lg border-l-4 border-green-500 bg-white p-4 shadow-md
        transition-all duration-200 hover:shadow-lg
      "
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Coach Icon */}
            <div
              className="
              flex h-12 w-12 items-center justify-center 
              rounded-full bg-green-600 text-xs font-bold text-white
            "
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>

            {/* Coach Info */}
            <div>
              <h3 className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{coachInfo.role}</p>
              <p className="text-xs text-gray-500">
                Started: {coachInfo.startDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => handleEditMember(user.id!)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleRemoveFromTeam(user.id!, 'coach')}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Show if coach is also a player */}
        {user.teamPlayers && user.teamPlayers.length > 0 && (
          <div className="mt-2 border-t border-gray-100 pt-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Also: Player #{user.teamPlayers[0].jerseyNumber}
            </span>
          </div>
        )}
      </div>
    );
  };

  // =================================
  // LOADING STATE
  // =================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading team roster...</span>
      </div>
    );
  }

  // =================================
  // MAIN RENDER
  // =================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{teamName} Roster</h1>
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <span>Players: {players.length}</span>
          <span>Coaches: {coaches.length}</span>
          <span>Total: {mockTeamMembers.length}</span>
        </div>
      </div>

      {showSeparateSections ? (
        /* SEPARATED VIEW: Players and Coaches in separate sections */
        <div className="space-y-8">
          {/* Players Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-xl font-semibold text-gray-800">
                <span className="mr-2 h-4 w-4 rounded-full bg-blue-500"></span>
                Players ({players.length})
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Add Player
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {players.map(renderPlayerCard)}
            </div>
          </div>

          {/* Coaches Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-xl font-semibold text-gray-800">
                <span className="mr-2 h-4 w-4 rounded-full bg-green-500"></span>
                Coaches ({coaches.length})
              </h2>
              <button className="text-sm text-green-600 hover:text-green-800">
                Add Coach
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coaches.map(renderCoachCard)}
            </div>
          </div>
        </div>
      ) : (
        /* UNIFIED VIEW: All team members together, grouped by role */
        <div className="space-y-6">
          {/* Players Only */}
          {playersOnly.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
                <span className="mr-2 h-3 w-3 rounded-full bg-blue-500"></span>
                Players ({playersOnly.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playersOnly.map(renderPlayerCard)}
              </div>
            </div>
          )}

          {/* Player-Coaches (Dual Role) */}
          {playerCoaches.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
                <span className="mr-2 h-3 w-3 rounded-full bg-purple-500"></span>
                Player-Coaches ({playerCoaches.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playerCoaches.map(renderPlayerCard)}{' '}
                {/* Show as player card with coach badge */}
              </div>
            </div>
          )}

          {/* Coaches Only */}
          {coachesOnly.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
                <span className="mr-2 h-3 w-3 rounded-full bg-green-500"></span>
                Coaches ({coachesOnly.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coachesOnly.map(renderCoachCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {mockTeamMembers.length === 0 && (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No team members yet
          </h3>
          <p className="mb-4 text-gray-600">
            Start building your team by adding players and coaches.
          </p>
          <div className="space-x-3">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Add Player
            </button>
            <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
              Add Coach
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================
// USAGE EXAMPLES
// =================================

/*
// Example 1: Basic team roster
<TeamRosterComposition teamId="team-123" teamName="Thunder FC" />

// Example 2: Separated players and coaches sections
<TeamRosterComposition 
  teamId="team-123" 
  teamName="Thunder FC" 
  showSeparateSections={true} 
/>

// Example 3: In a team management page
function TeamManagePage({ teamId }: { teamId: string }) {
  return (
    <div className="space-y-8">
      <TeamRosterComposition teamId={teamId} teamName="Thunder FC" />
      
      // Other team management components...
    </div>
  );
}
*/
