import { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

import { ImpersonationBannerPresentation } from '../presentation/impersonation-banner.presentation';

/**
 * Smart component that detects Clerk impersonation sessions and renders the banner.
 * Uses Clerk's useAuth hook to access the actor (impersonator) information.
 *
 * When an admin impersonates a user via Clerk Dashboard, the `actor` property
 * in the auth context contains the impersonator's information.
 *
 * @see https://clerk.com/docs/guides/users/impersonation
 */
export const ImpersonationBannerSmart = () => {
  const { actor, signOut } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // If no actor, this is not an impersonation session
  if (!actor) {
    return null;
  }

  // Get the impersonated user's name
  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.primaryEmailAddress?.emailAddress ||
      'Unknown User'
    : 'Unknown User';

  const handleExitImpersonation = async () => {
    // Sign out ends the impersonation session
    // The admin will be redirected to sign back in as themselves
    setError(null);
    setIsExiting(true);
    try {
      await signOut();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to exit impersonation session: ${errorMessage}`);
      setIsExiting(false);
    }
  };

  return (
    <ImpersonationBannerPresentation
      userName={userName}
      onExitImpersonation={handleExitImpersonation}
      error={error}
      isExiting={isExiting}
    />
  );
};
