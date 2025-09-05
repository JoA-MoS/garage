import { useParams } from 'react-router';

import { TeamPlayersSmart } from '../components/smart/team-players.smart';
import { TeamLayout } from '../components/layout/team-layout';

/**
 * Page component for managing players on a specific team
 */
export const TeamPlayersPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <TeamLayout>
        <div className="p-4">
          <div className="text-red-600">Error: No team ID provided</div>
        </div>
      </TeamLayout>
    );
  }

  return (
    <TeamLayout>
      <TeamPlayersSmart teamId={teamId} />
    </TeamLayout>
  );
};
