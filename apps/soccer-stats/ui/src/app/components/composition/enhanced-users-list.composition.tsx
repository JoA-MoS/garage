import { useState, useCallback } from 'react';
// import { useQuery } from '@apollo/client';

import { UserCardNewSmart } from '../smart/user-card-new.smart';
import {
  GET_ALL_USERS,
  GET_PLAYERS,
  GET_COACHES,
  GET_USERS_BY_TEAM,
  GET_PLAYERS_BY_TEAM,
  GET_COACHES_BY_TEAM,
  User,
} from '../../services/users-graphql.service';

interface UsersListCompositionProps {
  /**
   * Type of users to display
   * - 'all': Shows all users (players, coaches, others)
   * - 'players': Shows only users with player relationships
   * - 'coaches': Shows only users with coach relationships
   */
  userType?: 'all' | 'players' | 'coaches';

  /**
   * Optional team ID to filter users by team membership
   * When provided, shows only users associated with that team
   */
  teamId?: string;

  /**
   * Optional title override
   */
  title?: string;
}

export const UsersListComposition = ({
  userType = 'all',
  teamId,
  title,
}: UsersListCompositionProps = {}) => {
  // =================================
  // QUERY SELECTION LOGIC
  // =================================

  // This demonstrates how to choose the right query based on props
  // In a real implementation, you'd use useQuery with the selected query

  const getSelectedQuery = () => {
    if (teamId) {
      // Team-specific queries
      switch (userType) {
        case 'players':
          return GET_PLAYERS_BY_TEAM; // Only players on this team
        case 'coaches':
          return GET_COACHES_BY_TEAM; // Only coaches on this team
        default:
          return GET_USERS_BY_TEAM; // All team members (players + coaches)
      }
    } else {
      // General queries
      switch (userType) {
        case 'players':
          return GET_PLAYERS; // All players in system
        case 'coaches':
          return GET_COACHES; // All coaches in system
        default:
          return GET_ALL_USERS; // All users in system
      }
    }
  };

  // TODO: This will use the actual query when GraphQL is connected
  // const selectedQuery = getSelectedQuery();
  // const { data, loading, error } = useQuery(selectedQuery, {
  //   variables: teamId ? { teamId } : undefined
  // });

  // Mock loading state management for development
  const [isLoading] = useState(false);

  // =================================
  // ENHANCED MOCK DATA
  // =================================

  // Mock data that demonstrates the unified user structure
  const mockUsers: Partial<User>[] = [
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
          isActive: true,
          team: { id: 'team1', name: 'Thunder FC', shortName: 'TFC' },
        },
      ],
      teamCoaches: [], // Not a coach
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      teamPlayers: [], // Not a player
      teamCoaches: [
        {
          id: 'tc1',
          role: 'Head Coach',
          startDate: new Date('2023-01-01'),
          isActive: true,
          team: { id: 'team1', name: 'Thunder FC', shortName: 'TFC' },
        },
      ],
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      teamPlayers: [
        {
          id: 'tp2',
          jerseyNumber: '8',
          primaryPosition: 'Midfielder',
          isActive: true,
          team: { id: 'team1', name: 'Thunder FC', shortName: 'TFC' },
        },
      ],
      teamCoaches: [
        {
          id: 'tc2',
          role: 'Assistant Coach',
          startDate: new Date('2023-06-01'),
          isActive: true,
          team: { id: 'team1', name: 'Thunder FC', shortName: 'TFC' },
        },
      ],
    }, // This user is BOTH a player AND coach
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@example.com',
      teamPlayers: [
        {
          id: 'tp3',
          jerseyNumber: '1',
          primaryPosition: 'Goalkeeper',
          isActive: true,
          team: { id: 'team2', name: 'Lightning United', shortName: 'LU' },
        },
      ],
      teamCoaches: [],
    },
  ];

  // Filter mock data based on userType for demonstration
  const getFilteredUsers = () => {
    switch (userType) {
      case 'players':
        return mockUsers.filter(
          (user) => user.teamPlayers && user.teamPlayers.length > 0
        );
      case 'coaches':
        return mockUsers.filter(
          (user) => user.teamCoaches && user.teamCoaches.length > 0
        );
      default:
        return mockUsers; // Return all users
    }
  };

  const filteredUsers = getFilteredUsers();

  // =================================
  // EVENT HANDLERS
  // =================================

  const handleEditUser = useCallback((userId: string) => {
    console.log('Edit user:', userId);
    // TODO: Navigate to edit user page or open modal
  }, []);

  const handleViewUser = useCallback((userId: string) => {
    console.log('View user:', userId);
    // TODO: Navigate to user detail page
  }, []);

  const handleToggleActive = useCallback(
    (userId: string, isActive: boolean) => {
      console.log('Toggle active for user:', userId, 'to:', isActive);
      // TODO: Call UPDATE_USER mutation to update user active status
    },
    []
  );

  // =================================
  // HELPER FUNCTIONS
  // =================================

  const getDisplayTitle = () => {
    if (title) return title;

    const baseTitle =
      userType === 'players'
        ? 'Players'
        : userType === 'coaches'
        ? 'Coaches'
        : 'Team Members';

    if (teamId) {
      return `${baseTitle} - Team`;
    }

    return `All ${baseTitle}`;
  };

  const getUserTypeLabel = (user: Partial<User>) => {
    const isPlayer = user.teamPlayers && user.teamPlayers.length > 0;
    const isCoach = user.teamCoaches && user.teamCoaches.length > 0;

    if (isPlayer && isCoach) return 'Player/Coach';
    if (isPlayer) return 'Player';
    if (isCoach) return 'Coach';
    return 'Member';
  };

  // =================================
  // RENDER LOADING STATE
  // =================================

  if (isLoading) {
    return (
      <div
        className="
        flex min-h-96 items-center justify-center p-4
        sm:p-6 md:p-8
      "
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">
            Loading {getDisplayTitle().toLowerCase()}...
          </p>
        </div>
      </div>
    );
  }

  // =================================
  // RENDER MAIN CONTENT
  // =================================

  return (
    <div
      className="
      /* Mobile-first */ /*
      Progressive enhancement
      
      */ container space-y-4 p-4
      sm:space-y-6 sm:p-6
      md:space-y-8 md:p-8
    "
    >
      {/* Header Section */}
      <div className="space-y-2">
        <h2
          className="
          text-2xl font-bold text-gray-900
          sm:text-3xl
          md:text-4xl
        "
        >
          {getDisplayTitle()}
        </h2>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total: {filteredUsers.length}</span>
          {userType === 'all' && (
            <span>
              Players: {mockUsers.filter((u) => u.teamPlayers?.length).length} |
              Coaches: {mockUsers.filter((u) => u.teamCoaches?.length).length}
            </span>
          )}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div
          className="
          /* Mobile: single column */
          /* Tablet: 2
          
          columns */ /* Desktop: 3
          columns */
          
          grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6
          lg:grid-cols-3 lg:gap-8
        "
        >
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="
              rounded-lg border border-gray-200 bg-white p-4 shadow-md
              transition-shadow duration-200 hover:shadow-lg
            "
            >
              {/* User Basic Info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>

                <p className="text-sm text-gray-600">{user.email}</p>

                <div className="flex items-center justify-between">
                  <span
                    className="
                    inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs
                    font-medium text-blue-800
                  "
                  >
                    {getUserTypeLabel(user)}
                  </span>
                </div>
              </div>

              {/* Player Information */}
              {user.teamPlayers && user.teamPlayers.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Player Info
                  </h4>
                  {user.teamPlayers.map((tp) => (
                    <div key={tp.id} className="text-xs text-gray-600">
                      <p>
                        #{tp.jerseyNumber} - {tp.primaryPosition}
                      </p>
                      <p>{tp.team.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Coach Information */}
              {user.teamCoaches && user.teamCoaches.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Coach Info
                  </h4>
                  {user.teamCoaches.map((tc) => (
                    <div key={tc.id} className="text-xs text-gray-600">
                      <p>{tc.role}</p>
                      <p>{tc.team.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleViewUser(user.id!)}
                  className="
                    flex-1 rounded-md bg-blue-100 px-3 py-2 text-sm
                    font-medium text-blue-700 transition-colors
                    duration-200 hover:bg-blue-200
                  "
                >
                  View
                </button>
                <button
                  onClick={() => handleEditUser(user.id!)}
                  className="
                    flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm
                    font-medium text-gray-700 transition-colors
                    duration-200 hover:bg-gray-200
                  "
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="
          rounded-lg border-2
          border-dashed border-gray-200 bg-gray-50 py-12 text-center
        "
        >
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">
              No {getDisplayTitle().toLowerCase()} found
            </h3>
            <p className="text-gray-600">
              {teamId
                ? `No ${userType} found for this team`
                : `No ${userType} have been added yet`}
            </p>
            <button
              className="
              mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm
              font-medium text-white transition-colors
              duration-200 hover:bg-blue-700
            "
            >
              Add{' '}
              {userType === 'players'
                ? 'Player'
                : userType === 'coaches'
                ? 'Coach'
                : 'User'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =================================
// USAGE EXAMPLES (for documentation)
// =================================

/*
// Example 1: Show all users (players, coaches, others)
<UsersListComposition userType="all" />

// Example 2: Show only players
<UsersListComposition userType="players" />

// Example 3: Show only coaches  
<UsersListComposition userType="coaches" />

// Example 4: Show all team members for a specific team
<UsersListComposition userType="all" teamId="team-uuid" title="Thunder FC Roster" />

// Example 5: Show only players on a specific team
<UsersListComposition userType="players" teamId="team-uuid" title="Thunder FC Players" />

// Example 6: Show only coaches on a specific team
<UsersListComposition userType="coaches" teamId="team-uuid" title="Thunder FC Coaching Staff" />
*/
