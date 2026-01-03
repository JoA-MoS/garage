import { memo } from 'react';

import { ModalPortal } from './modal-portal.presentation';

interface DependentEvent {
  id: string;
  eventType: string;
  gameMinute: number;
  gameSecond: number;
  playerName?: string | null;
  description?: string | null;
}

export interface CascadeDeleteModalProps {
  isOpen: boolean;
  eventType: string;
  dependentEvents: DependentEvent[];
  warningMessage?: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CascadeDeleteModal = memo(function CascadeDeleteModal({
  isOpen,
  eventType,
  dependentEvents,
  warningMessage,
  isDeleting,
  onConfirm,
  onCancel,
}: CascadeDeleteModalProps) {
  const formatTime = (minute: number, second: number) =>
    `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL':
        return '🥅';
      case 'ASSIST':
        return '👟';
      case 'SUBSTITUTION_OUT':
      case 'SUBSTITUTION_IN':
        return '🔄';
      case 'POSITION_SWAP':
        return '↔️';
      default:
        return '📋';
    }
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case 'goal':
        return 'Goal';
      case 'substitution':
        return 'Substitution';
      case 'position_swap':
        return 'Position Swap';
      case 'starter_entry':
        return 'Starter Entry';
      default:
        return type;
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="mx-4 max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
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
                Delete {formatEventType(eventType)}?
              </h3>
              <p className="text-sm text-red-600">
                This will also delete related events
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          {warningMessage && (
            <p className="mb-4 text-sm text-gray-600">{warningMessage}</p>
          )}

          {dependentEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                The following events will be deleted:
              </p>
              <div className="space-y-2">
                {dependentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-3"
                  >
                    <span className="text-lg">
                      {getEventIcon(event.eventType)}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {event.description || event.eventType}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(event.gameMinute, event.gameSecond)}
                        {event.playerName && ` - ${event.playerName}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            type="button"
          >
            {isDeleting ? (
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
                Deleting...
              </span>
            ) : (
              `Delete All (${dependentEvents.length + 1})`
            )}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
});
