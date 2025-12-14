import { useParams } from 'react-router';

import { TeamGamesSmart } from '../components/smart/team-games.smart';

/**
 * Page component for managing games for a specific team
 */
export const TeamGamesPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="p-4">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  return <TeamGamesSmart teamId={teamId} />;
};
