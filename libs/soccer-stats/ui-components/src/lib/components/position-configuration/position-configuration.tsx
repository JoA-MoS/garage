import { memo, useState } from 'react';

import type { UIPosition } from '../../types';

export interface PositionConfigurationProps {
  /** List of positions to display and edit */
  positions: UIPosition[];
  /** Callback when a position is updated */
  onPositionUpdate: (positionId: string, updates: Partial<UIPosition>) => void;
  /** Callback when a new position should be added */
  onAddPosition: () => void;
  /** Callback when a position should be removed */
  onRemovePosition: (positionId: string) => void;
  /** Callback for next step navigation */
  onNext: () => void;
  /** Callback for previous step navigation */
  onPrevious: () => void;
  /** Whether the component is embedded in a tab interface */
  isTabMode?: boolean;
}

/**
 * PositionConfiguration allows users to visually configure field positions
 * with drag-and-drop support on a soccer field diagram.
 *
 * Features:
 * - Interactive field visualization with position markers
 * - Drag-and-drop position adjustment
 * - Click-to-move selected positions
 * - Edit position names and abbreviations
 * - Add/remove positions dynamically
 */
export const PositionConfiguration = memo(function PositionConfiguration({
  positions,
  onPositionUpdate,
  onAddPosition,
  onRemovePosition,
  onNext,
  onPrevious,
  isTabMode = false,
}: PositionConfigurationProps) {
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
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    setIsDragging(true);
    const field = event.currentTarget.closest(
      '.field-container',
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
    <div className={isTabMode ? 'space-y-6' : 'mx-auto max-w-6xl p-6'}>
      <div className={isTabMode ? '' : 'rounded-lg bg-white shadow-lg'}>
        {/* Header - only show if not in tab mode */}
        {!isTabMode && (
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Configure Positions
            </h1>
            <p className="mt-1 text-gray-600">
              Customize your team's field positions
            </p>
          </div>
        )}

        {/* Content */}
        <div className={isTabMode ? '' : 'p-6'}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Field Visualization */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Field Layout
                </h3>
                <p className="text-sm text-gray-600">
                  Click on a position in the list to select it, then click on
                  the field to move it. You can also drag positions directly.
                </p>
              </div>

              <div
                className="field-container relative cursor-crosshair rounded-lg border-2 border-green-300 bg-green-100"
                style={{ paddingBottom: '60%' }}
                onClick={handleFieldClick}
              >
                {/* Field markings */}
                <div className="absolute inset-0">
                  {/* Center line */}
                  <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 transform bg-green-400"></div>
                  {/* Center circle */}
                  <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 transform rounded-full border border-green-400"></div>
                  {/* Goal areas */}
                  <div className="absolute bottom-1/3 left-0 top-1/3 w-8 border-r border-green-400"></div>
                  <div className="absolute bottom-1/3 right-0 top-1/3 w-8 border-l border-green-400"></div>
                  {/* Goals */}
                  <div className="bottom-2/5 top-2/5 absolute -left-2 w-2 bg-gray-400"></div>
                  <div className="bottom-2/5 top-2/5 absolute -right-2 w-2 bg-gray-400"></div>
                </div>

                {/* Positions */}
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transform cursor-move ${
                      selectedPosition === position.id ? 'z-10' : 'z-0'
                    }`}
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
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-medium text-white shadow-lg transition-all ${
                        selectedPosition === position.id
                          ? 'scale-110 border-blue-800 bg-blue-600'
                          : 'border-blue-700 bg-blue-500 hover:scale-105'
                      }`}
                    >
                      {position.abbreviation}
                    </div>
                    <div className="absolute left-1/2 top-12 -translate-x-1/2 transform whitespace-nowrap rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
                      {position.name}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPosition && (
                <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong>{' '}
                    {positions.find((p) => p.id === selectedPosition)?.name}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    Click anywhere on the field to move this position, or drag
                    it directly.
                  </p>
                </div>
              )}
            </div>

            {/* Position List and Controls */}
            <div className="lg:col-span-1">
              <div className="mb-4">
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Positions
                </h3>
                <button
                  onClick={onAddPosition}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  + Add Position
                </button>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className={`cursor-pointer rounded-md border p-3 transition-colors ${
                      selectedPosition === position.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPosition(position.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                          {position.abbreviation}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
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
                        className="text-sm text-red-400 hover:text-red-600"
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
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <div className="mt-6 flex justify-between border-t border-gray-200 pt-6">
            <button
              onClick={onPrevious}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isTabMode ? '← Previous' : '← Back to Formation'}
            </button>
            <button
              onClick={onNext}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isTabMode ? 'Next →' : 'Continue to Players →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
