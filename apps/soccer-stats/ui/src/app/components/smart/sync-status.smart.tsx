import { useGameOutbox } from '../../outbox/game-outbox-context';
import type { OutboxAction, OutboxActionKind } from '../../outbox/outbox-types';

const ACTION_LABELS: Record<OutboxActionKind, string> = {
  batchLineupChanges: 'Substitutions',
  swapPositions: 'Position swap',
  substitutePlayer: 'Substitution',
  bringPlayerOntoField: 'Player added to field',
  removePlayerFromField: 'Player removed from field',
  recordPositionChange: 'Position change',
  recordFormationChange: 'Formation change',
  recordGoal: 'Goal',
  updateGame: 'Game update',
};

/** Short description of what an outbox action does. */
export function describeOutboxAction(action: OutboxAction): string {
  return ACTION_LABELS[action.kind] ?? 'Change';
}

/**
 * Shows whether this device's recorded changes have reached the server:
 * a quiet "Syncing" line while they're queued, and Retry / Discard for any
 * the server rejected. Renders nothing when everything is synced.
 */
export function SyncStatus() {
  const { actions, retry, discard } = useGameOutbox();
  const queued = actions.filter((a) => a.status === 'queued');
  const failed = actions.filter((a) => a.status === 'failed');

  if (queued.length === 0 && failed.length === 0) return null;

  return (
    <div className="space-y-2">
      {queued.length > 0 && (
        <p
          role="status"
          className="flex min-h-[44px] items-center justify-center gap-2 text-sm text-gray-500"
        >
          <span
            aria-hidden="true"
            className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
          />
          Syncing {queued.length} {queued.length === 1 ? 'change' : 'changes'}…
        </p>
      )}
      {failed.map((action) => (
        <div
          key={action.actionId}
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm">
            <span className="font-medium">
              {describeOutboxAction(action)} not saved.
            </span>{' '}
            {action.error}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void retry(action.actionId)}
              className="min-h-[44px] flex-1 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 sm:flex-none"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void discard(action.actionId)}
              className="min-h-[44px] flex-1 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-100 sm:flex-none"
            >
              Discard
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
