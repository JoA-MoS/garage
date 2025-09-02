import { Outlet } from 'react-router-dom';

import { NavigationSmart } from '../smart/navigation.smart';

/**
 * Main layout component that wraps all pages
 * Provides consistent navigation and structure
 */
export const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSmart />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
