import { useState, memo } from 'react';

import { ModalPortal } from './modal-portal.presentation';

interface ConflictingEvent {
  eventId: string;
  playerName: string;
  playerId?: string | null;
  recordedByUserName: string;
}

export interface ConflictResolutionModalProps {
  isOpen: boolean;
  conflictId: string;
  eventType: string;
  gameMinute: number;
  gameSecond: number;
  conflictingEvents: ConflictingEvent[];
  isResolving: boolean;
  onResolve: (
    conflictId: string,
    selectedEventId: string,
    keepAll: boolean
  ) => void;
  onClose: () => void;
}

export const ConflictResolutionModal = memo(function ConflictResolutionModal({
  isOpen,
  conflictId,
  eventType,
  gameMinute,
  gameSecond,
  conflictingEvents,
  isResolving,
  onResolve,
  onClose,
}: ConflictResolutionModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [keepAll, setKeepAll] = useState(false);

  const formatTime = (minute: number, second: number) =>
    `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  const formatEventType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'GOAL':
        return 'Goal';
      case 'SUBSTITUTION':
      case 'SUBSTITUTION_OUT':
      case 'SUBSTITUTION_IN':
        return 'Substitution';
      case 'POSITION_SWAP':
        return 'Position Swap';
      default:
        return type;
    }
  };

  const handleResolve = () => {
    if (keepAll) {
      // When keeping all, we still need to pass a selectedEventId (use first one)
      onResolve(conflictId, conflictingEvents[0].eventId, true);
    } else if (selectedEventId) {
      onResolve(conflictId, selectedEventId, false);
    }
  };

  const canResolve = keepAll || selectedEventId !== null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="mx-4 max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-6 w-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Conflict Detected
              </h3>
              <p className="text-sm text-amber-600">
                Multiple {formatEventType(eventType).toLowerCase()}s recorded at{' '}
                {formatTime(gameMinute, gameSecond)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          <p className="mb-4 text-sm text-gray-600">
            Multiple users recorded a {formatEventType(eventType).toLowerCase()}{' '}
            at the same time with different players. Which one is correct?
          </p>

          <div className="space-y-2">
            {conflictingEvents.map((event) => (
              <label
                key={event.eventId}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  selectedEventId === event.eventId && !keepAll
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${keepAll ? 'opacity-50' : ''}`}
              >
                <input
                  type="radio"
                  name="selectedEvent"
                  value={event.eventId}
                  checked={selectedEventId === event.eventId && !keepAll}
                  onChange={() => {
                    setSelectedEventId(event.eventId);
                    setKeepAll(false);
                  }}
                  disabled={isResolving || keepAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {event.playerName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Recorded by: {event.recordedByUserName}
                  </div>
                </div>
              </label>
            ))}

            {/* Keep All Option */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  keepAll
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={keepAll}
                  onChange={(e) => {
                    setKeepAll(e.target.checked);
                    if (e.target.checked) {
                      setSelectedEventId(null);
                    }
                  }}
                  disabled={isResolving}
                  className="h-4 w-4 rounded text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Both are correct
                  </div>
                  <div className="text-xs text-gray-500">
                    Keep all events (e.g., two separate goals at the same time)
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isResolving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            type="button"
          >
            Dismiss
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving || !canResolve}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            type="button"
          >
            {isResolving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
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
                Resolving...
              </span>
            ) : keepAll ? (
              'Keep All'
            ) : (
              'Confirm Selection'
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
});
