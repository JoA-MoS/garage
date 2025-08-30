interface TabNavigationPresentationProps {
  activeTab: string;
  homeTeamName: string;
  awayTeamName: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigationPresentation = ({
  activeTab,
  homeTeamName,
  awayTeamName,
  onTabChange,
}: TabNavigationPresentationProps) => {
  return (
    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onTabChange('home')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
          activeTab === 'home'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        {homeTeamName} Team
      </button>
      <button
        onClick={() => onTabChange('away')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
          activeTab === 'away'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        {awayTeamName} Team
      </button>
      <button
        onClick={() => onTabChange('stats')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
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
