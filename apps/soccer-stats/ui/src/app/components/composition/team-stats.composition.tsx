import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_BY_ID,
  TeamResponse,
} from '../../services/teams-graphql.service';
import { TeamStatsSmart } from '../smart/team-stats.smart';

interface TeamStatsCompositionProps {
  teamId: string;
}

export const TeamStatsComposition = ({ teamId }: TeamStatsCompositionProps) => {
  const { data, loading, error, refetch } = useQuery<TeamResponse>(
    GET_TEAM_BY_ID,
    {
      variables: { id: teamId },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !teamId,
    }
  );

  // Handle no team ID
  if (!teamId) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  // Handle loading state without data
  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="
          text-lg
          sm:text-xl
        "
        >
          Loading team statistics...
        </div>
      </div>
    );
  }

  // Handle error state without data
  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600 sm:p-6 md:p-8">
        <div
          className="
          text-lg font-semibold
          sm:text-xl
        "
        >
          Error loading team
        </div>
        <div
          className="
          mt-2 text-sm
          sm:text-base
        "
        >
          {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="
            mt-4 min-h-[44px] min-w-[44px] rounded bg-blue-600 px-4 py-3 text-white 
            transition-colors active:scale-95
            sm:py-2
            lg:hover:bg-blue-700
          "
        >
          Try Again
        </button>
      </div>
    );
  }

  // Handle team not found
  if (!data?.team) {
    return (
      <div className="p-4 text-center sm:p-6 md:p-8">
        <div
          className="
          text-lg
          sm:text-xl
        "
        >
          Team not found
        </div>
      </div>
    );
  }

  // Render the smart component with team data
  return (
    <TeamStatsSmart
      team={data.team}
      isLoading={loading}
      error={error?.message}
      onRetry={() => refetch()}
    />
  );
};
