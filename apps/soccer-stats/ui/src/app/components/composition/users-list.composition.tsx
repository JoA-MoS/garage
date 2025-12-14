import { useState, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';

import { graphql } from '../../generated/gql';
import { UserCardSmart, UserCardFragment } from '../smart/user-card.smart';

// Layer 3: Composition Component (Query Orchestration)
// Define query with collocated fragment spreading
const GetUsersForListQuery = graphql(/* GraphQL */ `
  query GetUsersForList {
    users {
      ...UserCard
    }
  }
`);

interface UsersListCompositionProps {
  onEditUser?: (userId: string) => void;
  onViewUser?: (userId: string) => void;
  onToggleUserActive?: (userId: string, isActive: boolean) => void;
  searchQuery?: string;
  showInactiveUsers?: boolean;
}

export const UsersListComposition = ({
  onEditUser,
  onViewUser,
  onToggleUserActive,
  searchQuery = '',
  showInactiveUsers = true,
}: UsersListCompositionProps = {}) => {
  const { data, loading, error } = useQuery(GetUsersForListQuery, {
    errorPolicy: 'all',
  });

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterActive, setFilterActive] = useState<boolean | null>(
    showInactiveUsers ? null : true
  );

  const handleEditUser = useCallback(
    (userId: string) => {
      if (onEditUser) {
        onEditUser(userId);
      } else {
        console.log('Edit user:', userId);
      }
    },
    [onEditUser]
  );

  const handleViewUser = useCallback(
    (userId: string) => {
      if (onViewUser) {
        onViewUser(userId);
      } else {
        console.log('View user details:', userId);
      }
    },
    [onViewUser]
  );

  const handleToggleUserActive = useCallback(
    (userId: string, isActive: boolean) => {
      if (onToggleUserActive) {
        onToggleUserActive(userId, isActive);
      } else {
        console.log('Toggle user active:', userId, isActive);
      }
    },
    [onToggleUserActive]
  );

  // Filter users based on search and active status
  const users = data?.users || [];
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      searchTerm === '' ||
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActiveFilter =
      filterActive === null || user.isActive === filterActive;

    return matchesSearch && matchesActiveFilter;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <div className="ml-4 text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="mb-2 text-lg font-medium text-red-600">
          Error loading users
        </div>
        <div className="text-sm text-red-500">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filter controls - Mobile-first design */}
      <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="max-w-lg flex-1">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-4">
          <button
            onClick={() => setFilterActive(null)}
            className={`min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors ${
              filterActive === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilterActive(true)}
            className={`min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors ${
              filterActive === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterActive(false)}
            className={`min-h-[44px] rounded-lg px-4 py-2 font-medium transition-colors ${
              filterActive === false
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* User count and results info */}
      <div className="text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
        {searchTerm && ` matching "${searchTerm}"`}
        {filterActive !== null &&
          ` (${filterActive ? 'active' : 'inactive'} only)`}
      </div>

      {/* Users list - Responsive grid layout */}
      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2 sm:gap-6
          lg:grid-cols-3 lg:gap-8
        "
      >
        {filteredUsers.map((user: any) => (
          <UserCardSmart
            key={user.id}
            user={user}
            onEdit={handleEditUser}
            onView={handleViewUser}
            onToggleActive={handleToggleUserActive}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredUsers.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-2 text-lg text-gray-500">
            {searchTerm || filterActive !== null
              ? 'No users match your criteria'
              : 'No users found'}
          </div>
          <div className="text-gray-400">
            {searchTerm || filterActive !== null
              ? 'Try adjusting your search or filter settings'
              : 'Users will appear here when they are added to the system'}
          </div>
        </div>
      )}
    </div>
  );
};
