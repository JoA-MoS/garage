import { useCallback } from 'react';

import { UserCardPresentation } from '../presentation/user-card.presentation';

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

  const primaryTeam = user.teamPlayers?.[0]?.team;

  return (
    <UserCardPresentation
      id={user.id}
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      phone={user.phone || ''}
      isActive={user.isActive}
      teamCount={user.teamPlayers?.length || 0}
      primaryTeam={primaryTeam?.name || ''}
      primaryPosition={user.teamPlayers?.[0]?.primaryPosition || ''}
      primaryJersey={user.teamPlayers?.[0]?.jerseyNumber?.toString() || ''}
      onEditClick={handleEdit}
      onViewClick={handleView}
      onToggleActiveClick={handleToggleActive}
    />
  );
};

export { UserCardSmartComponent as UserCardSmart };
