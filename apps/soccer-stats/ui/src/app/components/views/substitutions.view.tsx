import { SubstitutionsTabSmart } from '../smart/substitutions-tab.smart';
import { useGameContext } from '../../context/game.context';

/**
 * Substitutions management view
 */
export const SubstitutionsView = () => {
  const { gameData, gameActions } = useGameContext();

  const { homeTeam, awayTeam, gameTime, activeTab } = gameData;
  const { substitutePlayer, setActiveTab } = gameActions;

  // Default to home team if no active tab is set
  const currentTeam = activeTab === 'away' ? awayTeam : homeTeam;

  return (
    <div className="space-y-6">
      {/* Team Selector */}
      <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab !== 'away'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Home Team
        </button>
        <button
          onClick={() => setActiveTab('away')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
            activeTab === 'away'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Away Team
        </button>
      </div>

      {/* Substitutions Interface */}
      <SubstitutionsTabSmart
        team={currentTeam}
        gameTime={gameTime}
        onSubstitute={substitutePlayer}
      />
    </div>
  );
};
