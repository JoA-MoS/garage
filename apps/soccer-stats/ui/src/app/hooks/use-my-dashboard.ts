import { useQuery } from '@apollo/client/react';

import { GET_MY_DASHBOARD } from '../services/my-graphql.service';

import { useUserProfile } from './use-user-profile';

/**
 * Hook for fetching user-scoped dashboard data using the `my` viewer pattern.
 *
 * Returns the user's teams, upcoming games, recent games, and live games
 * in a single optimized query.
 *
 * @param options.upcomingLimit - Max number of upcoming games to fetch (default: 5)
 * @param options.recentLimit - Max number of recent games to fetch (default: 5)
 *
 * @see FEATURE_ROADMAP.md Issue #183
 */
export const useMyDashboard = (options?: {
  upcomingLimit?: number;
  recentLimit?: number;
}) => {
  const { isSignedIn, isLoaded } = useUserProfile();

  const {
    data: currentData,
    previousData,
    loading,
    error,
    refetch,
  } = useQuery(GET_MY_DASHBOARD, {
    variables: {
      upcomingLimit: options?.upcomingLimit ?? 5,
      recentLimit: options?.recentLimit ?? 5,
    },
    // Skip query if user isn't authenticated yet
    skip: !isLoaded || !isSignedIn,
    // Initial load: show cached data immediately, then update from network
    fetchPolicy: 'cache-and-network',
    // Subsequent renders: use cache to avoid unnecessary network requests
    nextFetchPolicy: 'cache-first',
  });
  // Apollo 4 clears `data` when a refetch fails (e.g. offline); keep the
  // last good result.
  const data = currentData ?? previousData;

  // Extract data from the `my` query response
  const myData = data?.my;

  return {
    // User data
    user: myData?.user ?? null,

    // Teams
    teams: myData?.teams ?? [],
    ownedTeams: myData?.ownedTeams ?? [],
    managedTeams: myData?.managedTeams ?? [],

    // Games
    upcomingGames: myData?.upcomingGames ?? [],
    recentGames: myData?.recentGames ?? [],
    liveGames: myData?.liveGames ?? [],

    // Computed values
    hasTeams: (myData?.teams?.length ?? 0) > 0,
    hasUpcomingGames: (myData?.upcomingGames?.length ?? 0) > 0,
    hasRecentGames: (myData?.recentGames?.length ?? 0) > 0,
    hasLiveGames: (myData?.liveGames?.length ?? 0) > 0,

    // Status
    isLoading: !isLoaded || (loading && !data),
    isAuthenticated: isSignedIn,
    // Only when there's nothing to show (a failed background refresh, e.g.
    // offline, keeps the cached dashboard).
    error: data ? undefined : error?.message,

    // Actions
    refetch,
  };
};
