import { useState } from 'react';

export interface TeamMemberForTransfer {
  id: string;
  role: string;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
}

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newOwnerId: string) => void;
  teamMembers: TeamMemberForTransfer[];
  loading?: boolean;
  error?: string;
}

export const TransferOwnershipModal = ({
  isOpen,
  onClose,
  onConfirm,
  teamMembers,
  loading = false,
  error,
}: TransferOwnershipModalProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  // Filter out the current owner (they can't transfer to themselves)
  const eligibleMembers = teamMembers.filter(
    (member) => member.role !== 'OWNER'
  );

  const selectedMember = eligibleMembers.find((m) => m.id === selectedMemberId);

  const canConfirm =
    selectedMemberId &&
    confirmText.toLowerCase() === 'transfer ownership' &&
    !loading;

  const handleConfirm = () => {
    if (canConfirm && selectedMemberId) {
      onConfirm(selectedMemberId);
    }
  };

  const handleClose = () => {
    setSelectedMemberId('');
    setConfirmText('');
    onClose();
  };

  const getMemberDisplayName = (member: TeamMemberForTransfer) => {
    const firstName = member.user.firstName || '';
    const lastName = member.user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || member.user.email || 'Unknown User';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transfer Team Ownership
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Transfer ownership of this team to another member.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex">
            <svg
              className="h-5 w-5 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action cannot be undone. You will
                lose owner privileges and become a Manager of this team.
              </p>
            </div>
          </div>
        </div>

        {/* Member Selection */}
        <div className="mb-4">
          <label
            htmlFor="new-owner"
            className="block text-sm font-medium text-gray-700"
          >
            Select New Owner
          </label>
          <select
            id="new-owner"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Choose a team member...</option>
            {eligibleMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {getMemberDisplayName(member)} ({member.role})
              </option>
            ))}
          </select>
          {eligibleMembers.length === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              No eligible team members found. Add members to the team first.
            </p>
          )}
        </div>

        {/* Confirmation Input */}
        {selectedMember && (
          <div className="mb-4">
            <label
              htmlFor="confirm-text"
              className="block text-sm font-medium text-gray-700"
            >
              Type{' '}
              <span className="font-mono text-red-600">transfer ownership</span>{' '}
              to confirm
            </label>
            <input
              type="text"
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="transfer ownership"
              disabled={loading}
            />
          </div>
        )}

        {/* Selected Member Preview */}
        {selectedMember && (
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              Ownership will be transferred to:
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {getMemberDisplayName(selectedMember)}
            </p>
            {selectedMember.user.email && (
              <p className="text-sm text-gray-500">
                {selectedMember.user.email}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Transferring...
              </span>
            ) : (
              'Transfer Ownership'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
