import { useState, useCallback } from 'react';

import { UserCardPresentation } from '../components/presentation/user-card.presentation';

/**
 * Users Page - demonstrates the user viewing functionality
 * Uses mock data until GraphQL integration is fully working
 * Following basic smart/presentation pattern for now
 */
export const UsersPage = () => {
  // Mock data for development - eventually this would come from GraphQL queries
  const mockUsers = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      isActive: true,
      teamCount: 1,
      primaryTeam: 'FC Barcelona',
      primaryPosition: 'Forward',
      primaryJersey: '10',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-987-6543',
      isActive: true,
      teamCount: 1,
      primaryTeam: 'Real Madrid',
      primaryPosition: 'Midfielder',
      primaryJersey: '7',
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: undefined,
      isActive: false,
      teamCount: 0,
      primaryTeam: undefined,
      primaryPosition: undefined,
      primaryJersey: undefined,
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@example.com',
      phone: '+1-555-456-7890',
      isActive: true,
      teamCount: 2,
      primaryTeam: 'Chelsea FC',
      primaryPosition: 'Defender',
      primaryJersey: '3',
    },
  ];

  // Local state for interactions
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Event handlers
  const handleEditUser = useCallback((userId: string) => {
    console.log('Edit user:', userId);
    // TODO: Navigate to edit user page or open modal
  }, []);

  const handleViewUser = useCallback((userId: string) => {
    console.log('View user:', userId);
    // TODO: Navigate to user detail page or open modal
  }, []);

  const handleToggleActive = useCallback(
    (userId: string, isActive: boolean) => {
      console.log('Toggle user active:', userId, !isActive);
      // TODO: Make API call to toggle user active status
    },
    []
  );

  // Filter users based on search and active status
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActiveFilter =
      filterActive === null || user.isActive === filterActive;

    return matchesSearch && matchesActiveFilter;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:mb-0">
            Users ({filteredUsers.length})
          </h1>

          {/* Actions */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Add User
            </button>
            <button className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active filter */}
          <select
            value={filterActive === null ? 'all' : filterActive.toString()}
            onChange={(e) =>
              setFilterActive(
                e.target.value === 'all' ? null : e.target.value === 'true'
              )
            }
            className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Grid - Mobile-first responsive design */}
      <div
        className="
        grid grid-cols-1 gap-4
        sm:grid-cols-2 sm:gap-6
        lg:grid-cols-3 lg:gap-8
        xl:grid-cols-4
      "
      >
        {filteredUsers.map((user) => (
          <UserCardPresentation
            key={user.id}
            id={user.id}
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            phone={user.phone}
            isActive={user.isActive}
            teamCount={user.teamCount}
            primaryTeam={user.primaryTeam}
            primaryPosition={user.primaryPosition}
            primaryJersey={user.primaryJersey}
            onEditClick={() => handleEditUser(user.id)}
            onViewClick={() => handleViewUser(user.id)}
            onToggleActiveClick={() =>
              handleToggleActive(user.id, user.isActive)
            }
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredUsers.length === 0 && searchTerm && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg text-gray-500">
            No users found matching &ldquo;{searchTerm}&rdquo;
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Clear search
          </button>
        </div>
      )}

      {mockUsers.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg text-gray-500">No users found</div>
          <button className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Create First User
          </button>
        </div>
      )}
    </div>
  );
};
