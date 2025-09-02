import { Link, useLocation } from 'react-router-dom';

/**
 * Main navigation component for the application
 */
export const NavigationPresentation = () => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/game/new', label: 'New Game', icon: '⚽' },
    { path: '/history', label: 'History', icon: '📈' },
    { path: '/players', label: 'Players', icon: '👥' },
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

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚽</span>
              <span className="text-xl font-bold text-gray-900">
                Soccer Stats
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
