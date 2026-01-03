import { memo } from 'react';

import type { UIGameFormat } from '../../types';

export interface GameFormatSelectionProps {
  /** Available game formats to choose from */
  gameFormats: UIGameFormat[];
  /** Currently selected format ID */
  selectedFormat?: string;
  /** Callback when a format is selected */
  onFormatSelect: (formatId: string) => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback for previous button */
  onPrevious: () => void;
  /** Whether to render in tab mode (simplified layout) */
  isTabMode?: boolean;
}

/**
 * Selection component for choosing a game format (3v3, 5v5, 7v7, etc).
 * Displays available formats as selectable cards with player counts.
 */
export const GameFormatSelection = memo(function GameFormatSelection({
  gameFormats,
  selectedFormat,
  onFormatSelect,
  onNext,
  onPrevious,
  isTabMode = false,
}: GameFormatSelectionProps) {
  return (
    <div className={isTabMode ? 'space-y-6' : 'mx-auto max-w-4xl p-6'}>
      <div className={isTabMode ? '' : 'rounded-lg bg-white shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Select Game Format
            </h1>
            <p className="mt-1 text-gray-600">
              Choose the game format for your team
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Game Format
            </h3>
            <p className="text-gray-600">
              Select the number of players on the field that matches your league
              or competition format.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gameFormats.map((format) => (
              <button
                key={format.id}
                type="button"
                className={`
                  relative cursor-pointer rounded-lg border-2 text-left transition-all duration-200
                  ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                onClick={() => onFormatSelect(format.id)}
              >
                <div className="p-6">
                  {/* Selection indicator */}
                  <div className="absolute right-4 top-4">
                    <div
                      className={`
                        flex h-6 w-6 items-center justify-center rounded-full border-2
                        ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {selectedFormat === format.id && (
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

                  {/* Format info */}
                  <div className="pr-8">
                    <h4 className="mb-2 text-xl font-semibold text-gray-900">
                      {format.displayName || format.name}
                    </h4>
                    <div className="mb-2 text-2xl font-bold text-blue-600">
                      {format.playersPerSide || format.playersPerTeam} Players
                    </div>
                    {format.description && (
                      <p className="text-sm text-gray-600">
                        {format.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Custom format option */}
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Custom Format</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Don't see your format? You can create a custom formation and
                  position setup after selecting the closest match above.
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
              {isTabMode ? '← Previous' : '← Back to Team Info'}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!selectedFormat}
              className={`
                inline-flex items-center rounded-md border border-transparent px-6 py-2 text-sm font-medium text-white shadow-sm
                ${
                  selectedFormat
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'cursor-not-allowed bg-gray-300'
                }
              `}
            >
              {isTabMode ? 'Next →' : 'Continue to Formation →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
