import { LineupPanelPresentationProps } from './types';

/**
 * Presentation component for the inline lineup panel
 */
export const LineupPanelPresentation = ({
  panelState,
  onPanelStateChange,
  gameStatus,
  teamName,
  teamColor,
  formation,
  playersPerTeam,
  onFieldPlayers,
  queue,
  filledPositions,
  requiredPositions,
}: LineupPanelPresentationProps) => {
  const filledCount = filledPositions.size;
  const totalPositions = playersPerTeam;
  const statusLabel = gameStatus === 'SCHEDULED' ? 'Starting Lineup' : 'Second Half Lineup';

  // Render collapsed bar
  if (panelState === 'collapsed') {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg"
        onClick={() => onPanelStateChange('bench-view')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onPanelStateChange('bench-view')}
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex min-h-[44px] items-center justify-between px-4 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-medium text-gray-900">{statusLabel}</span>
            <span className="text-sm text-gray-500">
              {filledCount}/{totalPositions}
            </span>
          </div>
          {queue.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {queue.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render expanded states (bench-view or expanded)
  const isExpanded = panelState === 'expanded';
  const panelHeight = isExpanded ? 'max-h-[60vh]' : 'max-h-[40vh]';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col overflow-hidden border-t border-gray-200 bg-white shadow-lg ${panelHeight}`}
    >
      {/* Drag handle indicator - clickable to collapse */}
      <button
        type="button"
        onClick={() => onPanelStateChange('collapsed')}
        className="flex w-full cursor-pointer justify-center py-2"
        aria-label="Collapse panel"
      >
        <div className="h-1 w-10 rounded-full bg-gray-300" />
      </button>

      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 pb-3 pt-1"
        onClick={() => onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === 'Enter' && onPanelStateChange(isExpanded ? 'bench-view' : 'expanded')
        }
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: teamColor }}
          />
          <span className="font-medium text-gray-900">{teamName}</span>
          <span className="text-sm text-gray-500">
            {formation || 'No formation'} • {filledCount}/{totalPositions}
          </span>
        </div>
      </div>

      {/* Content area - placeholder for now */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-sm text-gray-500">Panel content coming in next tasks...</p>
      </div>
    </div>
  );
};
