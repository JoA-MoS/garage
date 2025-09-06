import { UIGameFormat } from '../types/ui.types';

interface GameFormatSelectionPresentationProps {
  gameFormats: UIGameFormat[];
  selectedFormat?: string;
  onFormatSelect: (formatId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTabMode?: boolean;
}

export const GameFormatSelectionPresentation = ({
  gameFormats,
  selectedFormat,
  onFormatSelect,
  onNext,
  onPrevious,
  isTabMode = false,
}: GameFormatSelectionPresentationProps) => {
  return (
    <div className={isTabMode ? 'space-y-6' : 'max-w-4xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Select Game Format
            </h1>
            <p className="text-gray-600 mt-1">
              Choose the game format for your team
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Game Format
            </h3>
            <p className="text-gray-600">
              Select the number of players on the field that matches your league
              or competition format.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameFormats.map((format) => (
              <div
                key={format.id}
                className={`
                  relative rounded-lg border-2 cursor-pointer transition-all duration-200
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
                  <div className="absolute top-4 right-4">
                    <div
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {selectedFormat === format.id && (
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

                  {/* Format info */}
                  <div className="pr-8">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {format.displayName}
                    </h4>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {format.playersPerSide} Players
                    </div>
                    <p className="text-gray-600 text-sm">
                      {format.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom format option */}
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Custom Format</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Don't see your format? You can create a custom formation and
                  position setup after selecting the closest match above.
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
              {isTabMode ? '← Previous' : '← Back to Team Info'}
            </button>
            <button
              onClick={onNext}
              disabled={!selectedFormat}
              className={`
                inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
                ${
                  selectedFormat
                    ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    : 'bg-gray-300 cursor-not-allowed'
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
};
