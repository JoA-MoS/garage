import { useCallback } from 'react';

import { UserCard } from '@garage/soccer-stats/ui-components';
import {
  FragmentType,
  useFragment,
  graphql,
} from '@garage/soccer-stats/graphql-codegen';

// Layer 2: Fragment Wrapper (Smart Component)
// Define the fragment for user card data
export const UserCardFragment = graphql(/* GraphQL */ `
  fragment UserCard on User {
    id
    firstName
    lastName
    email
    phone
    isActive
    playerTeams {
      id
      jerseyNumber
      primaryPosition
      team {
        id
        name
        shortName
      }
    }
  }
`);

interface UserCardSmartProps {
  user: FragmentType<typeof UserCardFragment>;
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
  // Use fragment masking to extract typed data
  const user = useFragment(UserCardFragment, userFragment);

  const handleEdit = useCallback(() => {
    onEdit(user.id);
  }, [user.id, onEdit]);

  const handleView = useCallback(() => {
    onView(user.id);
  }, [user.id, onView]);

  const handleToggleActive = useCallback(() => {
    onToggleActive(user.id, !user.isActive);
  }, [user.id, user.isActive, onToggleActive]);

  const primaryTeam = user.playerTeams?.[0]?.team;

  return (
    <UserCard
      id={user.id}
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email || ''}
      phone={user.phone || ''}
      isActive={user.isActive}
      teamCount={user.playerTeams?.length || 0}
      primaryTeam={primaryTeam?.name || ''}
      primaryPosition={user.playerTeams?.[0]?.primaryPosition || ''}
      primaryJersey={user.playerTeams?.[0]?.jerseyNumber?.toString() || ''}
      onEditClick={handleEdit}
      onViewClick={handleView}
      onToggleActiveClick={handleToggleActive}
    />
  );
};

// Export as UserCardSmart for composition layer
export const UserCardSmart = UserCardSmartComponent;
