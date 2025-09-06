import { useParams } from 'react-router';

import { TeamPlayersSmart } from '../components/smart/team-players.smart';

/**
 * Page component for managing players on a specific team
 */
export const TeamPlayersPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  return <TeamPlayersSmart teamId={teamId} />;
};
