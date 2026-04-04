import { useState, useCallback } from 'react';
import { useQuery } from '@apollo/client/react';

import {
  GET_TEAM_STATS,
  type GetTeamStatsResponse,
} from '../../services/team-stats-graphql.service';
import { TeamStatsSmart } from '../smart/team-stats.smart';

interface TeamStatsCompositionProps {
  teamId: string;
}

export const TeamStatsComposition = ({ teamId }: TeamStatsCompositionProps) => {
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  const { data, loading, error, refetch } = useQuery<GetTeamStatsResponse>(
    GET_TEAM_STATS,
    {
      variables: {
        input: {
          teamId,
          ...(startDate && endDate
            ? {
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
              }
            : {}),
        },
      },
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !teamId,
    },
  );

  const handleDateRangeChange = useCallback(
    (newStartDate: string, newEndDate: string) => {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    },
    [],
  );

  const handleClearDateRange = useCallback(() => {
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  if (!teamId) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-red-600">Error: No team ID provided</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg sm:text-xl">Loading team statistics...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 text-center text-red-600 sm:p-6 md:p-8">
        <div className="text-lg font-semibold sm:text-xl">
          Error loading statistics
        </div>
        <div className="mt-2 text-sm sm:text-base">{error.message}</div>
        <button
          onClick={() => refetch()}
          className="mt-4 min-h-[44px] rounded bg-blue-600 px-4 py-3 text-white transition-colors active:scale-95 sm:py-2 lg:hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data?.teamStats) {
    return (
      <div className="p-4 text-center sm:p-6 md:p-8">
        <div className="text-lg sm:text-xl">No statistics available</div>
      </div>
    );
  }

  return (
    <TeamStatsSmart
      data={data.teamStats}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={handleDateRangeChange}
      onClearDateRange={handleClearDateRange}
      isLoading={loading}
      error={error?.message}
      onRetry={() => refetch()}
    />
  );
};
