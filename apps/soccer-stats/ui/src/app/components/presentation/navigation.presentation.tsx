import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/clerk-react';

/**
 * Main navigation component for the application
 * Mobile-first design with collapsible navigation menu
 */
export const NavigationPresentation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/game/new', label: 'New Game', icon: '⚽' },
    { path: '/history', label: 'History', icon: '📈' },
    { path: '/players', label: 'Players', icon: '👥' },
    { path: '/users', label: 'Users', icon: '👤' },
    { path: '/teams', label: 'Teams', icon: '🏆' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2"
              onClick={closeMobileMenu}
            >
              <span className="text-2xl">⚽</span>
              <span className="text-xl font-bold text-gray-900">
                Soccer Stats
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <SignedIn>
            <div className="hidden items-center space-x-4 md:flex">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </SignedIn>

          {/* Right side: Auth buttons and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Desktop auth buttons */}
            <div className="hidden items-center space-x-4 md:flex">
              <SignedOut>
                <SignInButton>
                  <button className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile auth and menu button */}
            <div className="flex items-center space-x-2 md:hidden">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button className="rounded-md p-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>

              {/* Mobile menu button */}
              <SignedIn>
                <button
                  onClick={toggleMobileMenu}
                  className="min-h-[44px] min-w-[44px] rounded-md p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Mobile navigation menu */}
        <SignedIn>
          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 py-4 md:hidden">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`block min-h-[44px] px-4 py-3 text-base font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'border-l-4 border-blue-500 bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Mobile auth section */}
              <SignedOut>
                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                  <SignUpButton>
                    <button className="min-h-[44px] w-full rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          )}
        </SignedIn>
      </div>
    </nav>
  );
};
