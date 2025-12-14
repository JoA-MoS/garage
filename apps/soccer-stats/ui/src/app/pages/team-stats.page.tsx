import { useParams } from 'react-router';

import { TeamStatsComposition } from '../components/composition/team-stats.composition';

/**
 * Page component for team statistics and analytics
 */
export const TeamStatsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  return <TeamStatsComposition teamId={teamId} />;
};
