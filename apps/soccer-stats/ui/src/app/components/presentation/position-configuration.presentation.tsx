import { useState } from 'react';

interface Position {
  id: string;
  name: string;
  abbreviation: string;
  x: number;
  y: number;
}

interface PositionConfigurationPresentationProps {
  positions: Position[];
  onPositionUpdate: (positionId: string, updates: Partial<Position>) => void;
  onAddPosition: () => void;
  onRemovePosition: (positionId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  isTabMode?: boolean;
}

export const PositionConfigurationPresentation = ({
  positions,
  onPositionUpdate,
  onAddPosition,
  onRemovePosition,
  onNext,
  onPrevious,
  isTabMode = false,
}: PositionConfigurationPresentationProps) => {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFieldClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedPosition && !isDragging) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      onPositionUpdate(selectedPosition, {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      });
    }
  };

  const handlePositionDrag = (
    positionId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    setIsDragging(true);
    const field = event.currentTarget.closest(
      '.field-container'
    ) as HTMLDivElement;
    if (!field) return;

    const position = positions.find((p) => p.id === positionId);
    if (!position) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = field.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onPositionUpdate(positionId, {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={isTabMode ? 'space-y-6' : 'max-w-6xl mx-auto p-6'}>
      <div className={isTabMode ? '' : 'bg-white rounded-lg shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Configure Positions
            </h1>
            <p className="text-gray-600 mt-1">
              Customize your team's field positions
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Field Visualization */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Field Layout
                </h3>
                <p className="text-sm text-gray-600">
                  Click on a position in the list to select it, then click on
                  the field to move it. You can also drag positions directly.
                </p>
              </div>

              <div
                className="field-container relative bg-green-100 border-2 border-green-300 rounded-lg cursor-crosshair"
                style={{ paddingBottom: '60%' }}
                onClick={handleFieldClick}
              >
                {/* Field markings */}
                <div className="absolute inset-0">
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-green-400 transform -translate-x-1/2"></div>
                  {/* Center circle */}
                  <div className="absolute left-1/2 top-1/2 w-16 h-16 border border-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                  {/* Goal areas */}
                  <div className="absolute left-0 top-1/3 bottom-1/3 w-8 border-r border-green-400"></div>
                  <div className="absolute right-0 top-1/3 bottom-1/3 w-8 border-l border-green-400"></div>
                  {/* Goals */}
                  <div className="absolute -left-2 top-2/5 bottom-2/5 w-2 bg-gray-400"></div>
                  <div className="absolute -right-2 top-2/5 bottom-2/5 w-2 bg-gray-400"></div>
                </div>

                {/* Positions */}
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`
                      absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move
                      ${selectedPosition === position.id ? 'z-10' : 'z-0'}
                    `}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                    }}
                    onMouseDown={(e) => handlePositionDrag(position.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPosition(position.id);
                    }}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center text-white text-xs font-medium shadow-lg transition-all
                        ${
                          selectedPosition === position.id
                            ? 'bg-blue-600 border-blue-800 scale-110'
                            : 'bg-blue-500 border-blue-700 hover:scale-105'
                        }
                      `}
                    >
                      {position.abbreviation}
                    </div>
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {position.name}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPosition && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong>{' '}
                    {positions.find((p) => p.id === selectedPosition)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Click anywhere on the field to move this position, or drag
                    it directly.
                  </p>
                </div>
              )}
            </div>

            {/* Position List and Controls */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Positions
                </h3>
                <button
                  onClick={onAddPosition}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add Position
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`
                      p-3 border rounded-md cursor-pointer transition-colors
                      ${
                        selectedPosition === position.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSelectedPosition(position.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {position.abbreviation}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {position.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {position.abbreviation}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePosition(position.id);
                        }}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    {selectedPosition === position.id && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            value={position.name}
                            onChange={(e) =>
                              onPositionUpdate(position.id, {
                                name: e.target.value,
                              })
                            }
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Abbreviation
                          </label>
                          <input
                            type="text"
                            value={position.abbreviation}
                            onChange={(e) =>
                              onPositionUpdate(position.id, {
                                abbreviation: e.target.value.toUpperCase(),
                              })
                            }
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onPrevious}
              className="inline-flex items-center px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTabMode ? '← Previous' : '← Back to Formation'}
            </button>
            <button
              onClick={onNext}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isTabMode ? 'Next →' : 'Continue to Players →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
