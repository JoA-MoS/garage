import { memo } from 'react';

export type EventType =
  | 'goal'
  | 'substitution'
  | 'position_swap'
  | 'starter_entry';

export interface EventCardProps {
  id: string;
  eventType: EventType;
  gameMinute: number;
  gameSecond: number;
  teamName: string;
  teamColor: string;
  // Goal-specific
  scorerName?: string | null;
  assisterName?: string | null;
  // Substitution-specific
  playerInName?: string | null;
  playerOutName?: string | null;
  // Position swap-specific
  player1Name?: string | null;
  player1Position?: string | null;
  player2Name?: string | null;
  player2Position?: string | null;
  // Actions
  onDeleteClick?: (id: string, eventType: EventType) => void;
  onEdit?: () => void;
  isDeleting?: boolean;
  isCheckingDependents?: boolean;
  // Real-time sync highlighting
  isHighlighted?: boolean;
}

export const EventCard = memo(function EventCard({
  id,
  eventType,
  gameMinute,
  gameSecond,
  teamName,
  teamColor,
  scorerName,
  assisterName,
  playerInName,
  playerOutName,
  player1Name,
  player1Position,
  player2Name,
  player2Position,
  onDeleteClick,
  onEdit,
  isDeleting = false,
  isCheckingDependents = false,
  isHighlighted = false,
}: EventCardProps) {
  const formattedTime = `${String(gameMinute).padStart(2, '0')}:${String(
    gameSecond
  ).padStart(2, '0')}`;

  const renderIcon = () => {
    switch (eventType) {
      case 'goal':
        return (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: teamColor }}
          >
            <span role="img" aria-label="Goal" className="text-xl">
              🥅
            </span>
          </div>
        );
      case 'substitution':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
        );
      case 'position_swap':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-5 w-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
        );
      case 'starter_entry':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </div>
        );
    }
  };

  const renderDetails = () => {
    switch (eventType) {
      case 'goal':
        return (
          <>
            <div className="font-semibold text-gray-900">Goal - {teamName}</div>
            <div className="text-sm text-gray-600">
              {scorerName}
              {assisterName && (
                <span className="text-gray-400"> (assist: {assisterName})</span>
              )}
            </div>
          </>
        );
      case 'substitution':
        return (
          <>
            <div className="font-semibold text-gray-900">
              Substitution - {teamName}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <svg
                  className="h-3 w-3 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {playerInName}
              </span>
              <span className="text-gray-400">for</span>
              <span className="inline-flex items-center gap-1">
                <svg
                  className="h-3 w-3 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {playerOutName}
              </span>
            </div>
          </>
        );
      case 'position_swap':
        return (
          <>
            <div className="font-semibold text-gray-900">
              Position Swap - {teamName}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">{player1Name}</span>
                {player1Position && (
                  <span className="text-purple-600">→ {player1Position}</span>
                )}
              </span>
              <span className="text-gray-400">↔</span>
              <span className="inline-flex items-center gap-1">
                <span className="font-medium">{player2Name}</span>
                {player2Position && (
                  <span className="text-purple-600">→ {player2Position}</span>
                )}
              </span>
            </div>
          </>
        );
      case 'starter_entry':
        return (
          <>
            <div className="font-semibold text-gray-900">
              Starter Entry - {teamName}
            </div>
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center gap-1 text-green-600">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {playerInName}
              </span>
            </div>
          </>
        );
    }
  };

  const renderActions = () => {
    return (
      <div className="flex items-center gap-1">
        {/* Edit button - only for goals */}
        {eventType === 'goal' && onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
            type="button"
            title="Edit goal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        )}
        {/* Delete button */}
        {onDeleteClick && (
          <button
            onClick={() => onDeleteClick(id, eventType)}
            disabled={isDeleting || isCheckingDependents}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            type="button"
            title={`Delete ${eventType.replace('_', ' ')}`}
          >
            {isCheckingDependents ? (
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : isDeleting ? (
              <svg
                className="h-5 w-5 animate-spin text-red-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 ${
        isHighlighted ? 'event-highlight' : ''
      }`}
    >
      {/* Time */}
      <div className="w-16 font-mono text-lg font-semibold text-gray-700">
        {formattedTime}
      </div>

      {/* Icon */}
      {renderIcon()}

      {/* Details */}
      <div className="flex-1">{renderDetails()}</div>

      {/* Actions */}
      {(onDeleteClick || onEdit) && renderActions()}
    </div>
  );
});
