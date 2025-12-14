import { useUser } from '@clerk/clerk-react';

/**
 * Custom hook to access user information and authentication state
 */
export const useUserProfile = () => {
  const { user, isSignedIn, isLoaded } = useUser();

  return {
    user,
    isSignedIn,
    isLoaded,
    userDisplayName: user?.fullName || user?.firstName || 'User',
    userEmail: user?.primaryEmailAddress?.emailAddress,
    userImageUrl: user?.imageUrl,
  };
};
