import { UIFormation } from '../types/ui.types';

interface FormationSelectionPresentationProps {
  formations: UIFormation[];
  selectedFormation?: string;
  gameFormat: string;
  onFormationSelect: (formationId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTabMode?: boolean;
}

export const FormationSelectionPresentation = ({
  formations,
  selectedFormation,
  gameFormat,
  onFormationSelect,
  onNext,
  onPrevious,
  isTabMode = false,
}: FormationSelectionPresentationProps) => {
  // Filter formations for the selected game format
  const availableFormations = formations.filter(
    (f) => f.gameFormat === gameFormat
  );

  return (
    <div className={isTabMode ? 'space-y-6' : 'max-w-4xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Select Formation
            </h1>
            <p className="text-gray-600 mt-1">
              Choose a formation for your team
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Formation Options
            </h3>
            <p className="text-gray-600">
              Select a formation that matches your team's playing style. You can
              customize positions in the next step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableFormations.map((formation) => (
              <div
                key={formation.id}
                className={`
                  relative rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${
                    selectedFormation === formation.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                onClick={() => onFormationSelect(formation.id)}
              >
                <div className="p-6">
                  {/* Selection indicator */}
                  <div className="absolute top-4 right-4">
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedFormation === formation.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {selectedFormation === formation.id && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Formation info */}
                  <div className="pr-8">
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                      {formation.name}
                    </h4>

                    {/* Formation visualization */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                      <div className="relative h-24 w-full">
                        {/* Field background */}
                        <div className="absolute inset-0 bg-green-100 rounded border border-green-300"></div>

                        {/* Player positions */}
                        {formation.positions.map((position, index) => (
                          <div
                            key={position.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                            }}
                          >
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm">
                              {position.abbreviation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      {formation.positions.length} positions defined
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom formation option */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-gray-400 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Custom Formation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Want to create your own formation? Select one of the options
                  above as a starting point and customize the positions in the
                  next step.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onPrevious}
              className="inline-flex items-center px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTabMode ? '← Previous' : '← Back to Game Format'}
            </button>
            <button
              onClick={onNext}
              disabled={!selectedFormation}
              className={`
                inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
                ${
                  selectedFormation
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {isTabMode ? 'Next →' : 'Continue to Positions →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
