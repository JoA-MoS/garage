import { useUser } from '@clerk/clerk-react';

import { useSession } from '../auth/session';

/**
 * Custom hook to access user information and authentication state.
 *
 * Signed-in state comes from the session, so it holds on the offline
 * session too; the Clerk profile (name, email, image) is unavailable there.
 */
export const useUserProfile = () => {
  const { user } = useUser();
  const { isSignedIn, isLoaded } = useSession();

  return {
    user,
    isSignedIn,
    isLoaded,
    userDisplayName: user?.fullName || user?.firstName || 'Coach',
    userEmail: user?.primaryEmailAddress?.emailAddress,
    userImageUrl: user?.imageUrl,
  };
};
