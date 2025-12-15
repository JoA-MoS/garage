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

  const handleExitImpersonation = () => {
    // Sign out ends the impersonation session
    // The admin will be redirected to sign back in as themselves
    signOut();
  };

  return (
    <ImpersonationBannerPresentation
      userName={userName}
      onExitImpersonation={handleExitImpersonation}
    />
  );
};
