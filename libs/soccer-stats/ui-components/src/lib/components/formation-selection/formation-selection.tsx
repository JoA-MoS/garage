import { memo, useMemo } from 'react';

import type { UIFormation } from '../../types';

export interface FormationSelectionProps {
  /** Available formations to choose from */
  formations: UIFormation[];
  /** Currently selected formation ID */
  selectedFormation?: string;
  /** Current game format ID for filtering formations */
  gameFormat: string;
  /** Callback when a formation is selected */
  onFormationSelect: (formationId: string) => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback for previous button */
  onPrevious: () => void;
  /** Whether to render in tab mode (simplified layout) */
  isTabMode?: boolean;
}

/**
 * Selection component for choosing a team formation.
 * Displays formations as selectable cards with visual position previews.
 * Filters formations based on the selected game format.
 */
export const FormationSelection = memo(function FormationSelection({
  formations,
  selectedFormation,
  gameFormat,
  onFormationSelect,
  onNext,
  onPrevious,
  isTabMode = false,
}: FormationSelectionProps) {
  // Filter formations for the selected game format
  const availableFormations = useMemo(
    () => formations.filter((f) => f.gameFormat === gameFormat),
    [formations, gameFormat],
  );

  return (
    <div className={isTabMode ? 'space-y-6' : 'mx-auto max-w-4xl p-6'}>
      <div className={isTabMode ? '' : 'rounded-lg bg-white shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Select Formation
            </h1>
            <p className="mt-1 text-gray-600">
              Choose a formation for your team
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Formation Options
            </h3>
            <p className="text-gray-600">
              Select a formation that matches your team's playing style. You can
              customize positions in the next step.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableFormations.map((formation) => (
              <button
                key={formation.id}
                type="button"
                className={`
                  relative cursor-pointer rounded-lg border-2 text-left transition-all duration-200
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
                  <div className="absolute right-4 top-4">
                    <div
                      className={`
                        flex h-6 w-6 items-center justify-center rounded-full border-2
                        ${
                          selectedFormation === formation.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {selectedFormation === formation.id && (
                        <svg
                          className="h-3 w-3 text-white"
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
                    <h4 className="mb-3 text-xl font-semibold text-gray-900">
                      {formation.name}
                    </h4>

                    {/* Formation visualization */}
                    <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="relative h-24 w-full">
                        {/* Field background */}
                        <div className="absolute inset-0 rounded border border-green-300 bg-green-100"></div>

                        {/* Player positions */}
                        {formation.positions.map((position) => (
                          <div
                            key={position.id}
                            className="absolute -translate-x-1/2 -translate-y-1/2 transform"
                            style={{
                              left: `${position.x}%`,
                              top: `${position.y}%`,
                            }}
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white shadow-sm">
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
              </button>
            ))}
          </div>

          {/* Empty state */}
          {availableFormations.length === 0 && (
            <div className="rounded-lg bg-gray-50 py-12 text-center">
              <p className="text-gray-500">
                No formations available for this game format.
              </p>
            </div>
          )}

          {/* Custom formation option */}
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="mt-1 h-5 w-5 text-gray-400"
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
                <p className="mt-1 text-sm text-gray-600">
                  Want to create your own formation? Select one of the options
                  above as a starting point and customize the positions in the
                  next step.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onPrevious}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isTabMode ? '← Previous' : '← Back to Game Format'}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!selectedFormation}
              className={`
                inline-flex items-center rounded-md border border-transparent px-6 py-2 text-sm font-medium text-white shadow-sm
                ${
                  selectedFormation
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'cursor-not-allowed bg-gray-300'
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
});
