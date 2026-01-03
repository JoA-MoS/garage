import { ModalPortal } from '../modal-portal';

export interface RemovePlayerDialogProps {
  playerName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const RemovePlayerDialog = ({
  playerName,
  onClose,
  onConfirm,
  loading,
}: RemovePlayerDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      console.error('Failed to remove player:', err);
    }
  };

  return (
    <ModalPortal isOpen={true} onBackdropClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Warning Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">
          Remove Player
        </h3>

        {/* Message */}
        <p className="mb-6 text-center text-gray-600">
          Are you sure you want to remove{' '}
          <span className="font-medium text-gray-900">{playerName}</span> from
          the team? This will mark them as inactive and record their departure
          date.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 lg:hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-touch flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 lg:hover:bg-red-700"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};
