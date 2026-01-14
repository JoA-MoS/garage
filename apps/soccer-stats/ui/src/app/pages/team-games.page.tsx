import { useParams } from 'react-router';

import { TeamGamesComposition } from '../components/composition/team-games.composition';

/**
 * Page component for managing games for a specific team.
 *
 * This is a thin wrapper that extracts route params and delegates
 * to the composition component for data fetching and orchestration.
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

  return <TeamGamesComposition teamId={teamId} />;
};
