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
      path: `/games/${gameId}/lineup/home`,
      label: `${homeTeamName} Team`,
      icon: '👥',
    },
    {
      path: `/games/${gameId}/lineup/away`,
      label: `${awayTeamName} Team`,
      icon: '👥',
    },
    { path: `/games/${gameId}/roster`, label: 'Roster', icon: '📋' },
    { path: `/games/${gameId}/stats`, label: 'Statistics', icon: '📊' },
    {
      path: `/games/${gameId}/substitutions`,
      label: 'Substitutions',
      icon: '🔄',
    },
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
      {navigationItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors duration-200 ${
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
