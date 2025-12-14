import { TeamWithGames } from '../../services/teams-graphql.service';
import { TeamConfiguration, Position } from '../smart/team-configuration.smart';

interface TeamConfigurationPresentationProps {
  team: TeamWithGames;
  configuration: TeamConfiguration;
  formations: string[];
  onFormationChange: (formation: string) => void;
  onPlayersOnFieldChange: (count: number) => void;
  onPositionUpdate: (positionId: string, updates: Partial<Position>) => void;
  onContinue: () => void;
  onBack: () => void;
  isTabMode?: boolean;
}

export const TeamConfigurationPresentation = ({
  team,
  configuration,
  formations,
  onFormationChange,
  onPlayersOnFieldChange,
  onContinue,
  onBack,
  isTabMode = false,
}: TeamConfigurationPresentationProps) => {
  return (
    <div className={isTabMode ? '' : 'max-w-4xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configure {team.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Set up your team's formation and field positions
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Step 2 of 3
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Team Info
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">
                  Configuration
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-400">Add Players</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={isTabMode ? 'space-y-6' : 'px-6 py-6'}>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Team Configuration
            </h3>
            <p className="text-blue-800 mb-4">
              Configure your team's formation and field positions.
            </p>
            <p className="text-sm text-blue-600">
              This section will allow you to set up your team's formation and
              customize player positions.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex justify-between pt-6 ${
              isTabMode ? '' : 'border-t border-gray-200'
            }`}
          >
            <button
              onClick={onBack}
              className="inline-flex items-center px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTabMode ? '← Previous' : '← Back to Team Info'}
            </button>
            <button
              onClick={onContinue}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTabMode ? 'Next →' : 'Continue to Add Players →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
