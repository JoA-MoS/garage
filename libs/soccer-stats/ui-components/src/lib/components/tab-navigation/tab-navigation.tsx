export interface TabNavigationProps {
  activeTab: string;
  homeTeamName: string;
  awayTeamName: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({
  activeTab,
  homeTeamName,
  awayTeamName,
  onTabChange,
}: TabNavigationProps) => {
  return (
    <div className="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
      <button
        onClick={() => onTabChange('home')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          activeTab === 'home'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        {homeTeamName} Team
      </button>
      <button
        onClick={() => onTabChange('away')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          activeTab === 'away'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        {awayTeamName} Team
      </button>
      <button
        onClick={() => onTabChange('roster')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          activeTab === 'roster'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Roster
      </button>
      <button
        onClick={() => onTabChange('history')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          activeTab === 'history'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        History
      </button>
      <button
        onClick={() => onTabChange('stats')}
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 ${
          activeTab === 'stats'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Statistics
      </button>
    </div>
  );
};
