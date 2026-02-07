import { Outlet } from 'react-router';

import { NavigationSmart } from '../smart/navigation.smart';
import { ProtectedRoute } from '../common/protected-route';
import { ImpersonationBannerSmart } from '../smart/impersonation-banner.smart';

/**
 * Main layout component that wraps all pages
 * Provides consistent navigation and structure
 */
export const Layout = () => {
  return (
    <div className="flex h-dvh flex-col bg-gray-50">
      <ImpersonationBannerSmart />
      <NavigationSmart />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </div>
      </main>
      <div id="panel-portal" />
    </div>
  );
};
