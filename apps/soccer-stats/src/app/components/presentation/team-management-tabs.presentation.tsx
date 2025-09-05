import { UITeam } from '../types/ui.types';

export type TeamManagementTab =
  | 'basic'
  | 'format'
  | 'formation'
  | 'positions'
  | 'players';

interface TeamManagementTabsProps {
  activeTab: TeamManagementTab;
  onTabChange: (tab: TeamManagementTab) => void;
  team?: UITeam;
  isEditing: boolean;
}

export const TeamManagementTabs = ({
  activeTab,
  onTabChange,
  team,
  isEditing,
}: TeamManagementTabsProps) => {
  const tabs = [
    {
      id: 'basic' as const,
      name: 'Basic Info',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: 'Team name, colors, and logo',
    },
    {
      id: 'format' as const,
      name: 'Game Format',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      description: 'Select 11v11, 9v9, or other format',
    },
    {
      id: 'formation' as const,
      name: 'Formation',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: 'Choose team formation',
    },
    {
      id: 'positions' as const,
      name: 'Positions',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      description: 'Customize field positions',
    },
    {
      id: 'players' as const,
      name: 'Players',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      description: 'Add and manage team roster',
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isCompleted = isEditing && team && tab.id === 'basic'; // Basic info is completed if we're editing

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`
                mr-3 flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : isCompleted
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }
              `}
              >
                {isCompleted && tab.id !== activeTab ? (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  tab.icon
                )}
              </div>
              <div className="text-left">
                <div>{tab.name}</div>
                <div className="text-xs text-gray-400 hidden sm:block">
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
