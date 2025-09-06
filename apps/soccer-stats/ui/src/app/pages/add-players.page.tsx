import { useParams } from 'react-router';

import { AddPlayersSmart } from '../components/smart/add-players.smart';

/**
 * Add players page - Add individual players to the team
 */
export const AddPlayersPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return <div>Team not found</div>;
  }

  return <AddPlayersSmart teamId={teamId} />;
};
