import { Link, useParams } from 'react-router';

interface GameNavigationPresentationProps {
  homeTeamName: string;
  awayTeamName: string;
  currentPath: string;
}

/**
 * Navigation component for game-specific tabs
 */
export const GameNavigationPresentation = ({
  homeTeamName,
  awayTeamName,
  currentPath,
}: GameNavigationPresentationProps) => {
  const { gameId } = useParams<{ gameId: string }>();

  const navigationItems = [
    {
      path: `/game/${gameId}/lineup/home`,
      label: `${homeTeamName} Team`,
      icon: '👥',
    },
    {
      path: `/game/${gameId}/lineup/away`,
      label: `${awayTeamName} Team`,
      icon: '👥',
    },
    { path: `/game/${gameId}/roster`, label: 'Roster', icon: '📋' },
    { path: `/game/${gameId}/stats`, label: 'Statistics', icon: '📊' },
    {
      path: `/game/${gameId}/substitutions`,
      label: 'Substitutions',
      icon: '🔄',
    },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
      {navigationItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 text-center ${
            isActive(item.path)
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="mr-1">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </div>
  );
};
