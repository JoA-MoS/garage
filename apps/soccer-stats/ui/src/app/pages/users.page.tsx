import { useCallback } from 'react';

import { UsersListComposition } from '../components/composition/users-list.composition';

/**
 * Users Page - comprehensive user viewing functionality
 * Now using the three-layer fragment architecture with real GraphQL data
 */
export const UsersPage = () => {
  const handleEditUser = useCallback((userId: string) => {
    // TODO: Navigate to user edit page or open edit modal
    console.log('Navigate to edit user:', userId);
  }, []);

  const handleViewUser = useCallback((userId: string) => {
    // TODO: Navigate to user detail page or open detail modal
    console.log('Navigate to view user details:', userId);
  }, []);

  const handleToggleUserActive = useCallback(
    (userId: string, isActive: boolean) => {
      // TODO: Implement user activation/deactivation mutation
      console.log(
        'Toggle user active status:',
        userId,
        'new status:',
        !isActive
      );
    },
    []
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Users
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Manage and view all users in the system
        </p>
      </div>

      <UsersListComposition
        onEditUser={handleEditUser}
        onViewUser={handleViewUser}
        onToggleUserActive={handleToggleUserActive}
      />
    </div>
  );
};
