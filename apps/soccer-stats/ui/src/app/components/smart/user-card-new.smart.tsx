import { useCallback } from 'react';

import { UserCard } from '@garage/soccer-stats/ui-components';

// TODO: Fix GraphQL fragment masking - temporarily using any type
interface UserCardSmartProps {
  user: any;
  onEdit: (userId: string) => void;
  onView: (userId: string) => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
}

export const UserCardSmartComponent = ({
  user: userFragment,
  onEdit,
  onView,
  onToggleActive,
}: UserCardSmartProps) => {
  const user = userFragment;

  const handleEdit = useCallback(() => {
    onEdit(user.id);
  }, [user.id, onEdit]);

  const handleView = useCallback(() => {
    onView(user.id);
  }, [user.id, onView]);

  const handleToggleActive = useCallback(() => {
    onToggleActive(user.id, !user.isActive);
  }, [user.id, user.isActive, onToggleActive]);

  return (
    <UserCard
      id={user.id}
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      phone={user.phone || undefined}
      isActive={user.isActive}
      teamCount={user.roster?.length || 0}
      primaryTeam={user.roster?.[0]?.team.name}
      primaryPosition={user.roster?.[0]?.primaryPosition || undefined}
      primaryJersey={user.roster?.[0]?.jerseyNumber || undefined}
      onEditClick={handleEdit}
      onViewClick={handleView}
      onToggleActiveClick={handleToggleActive}
    />
  );
};

export { UserCardSmartComponent as UserCardNewSmart };
