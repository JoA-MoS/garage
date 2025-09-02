import { useUser } from '@clerk/clerk-react';
import { NavigationPresentation } from '../presentation/navigation.presentation';

/**
 * Smart component for main application navigation
 * Handles user authentication state and navigation logic
 */
export const NavigationSmart = () => {
  const { user } = useUser();

  return <NavigationPresentation user={user} />;
};
