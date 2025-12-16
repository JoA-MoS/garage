import { useState, useMemo } from 'react';

export interface UserForSelection {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface PlayerForSelection {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    userId: string,
    role: string,
    linkedPlayerId?: string,
    isGuest?: boolean
  ) => void;
  users: UserForSelection[];
  teamPlayers: PlayerForSelection[];
  currentUserRole?: string;
  loading?: boolean;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: 'MANAGER', label: 'Manager', minRole: 'OWNER' },
  { value: 'COACH', label: 'Coach', minRole: 'MANAGER' },
  { value: 'PLAYER', label: 'Player', minRole: 'MANAGER' },
  { value: 'PARENT_FAN', label: 'Parent/Fan', minRole: 'COACH' },
];

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 5,
  MANAGER: 4,
  COACH: 3,
  PLAYER: 2,
  PARENT_FAN: 1,
};

export const AddTeamMemberModal = ({
  isOpen,
  onClose,
  onConfirm,
  users,
  teamPlayers,
  currentUserRole = 'PLAYER',
  loading = false,
  error,
}: AddTeamMemberModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [linkedPlayerId, setLinkedPlayerId] = useState<string>('');
  const [isGuest, setIsGuest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter roles based on current user's role
  const currentRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0;
  const availableRoles = ROLE_OPTIONS.filter((role) => {
    const minRoleLevel = ROLE_HIERARCHY[role.minRole] || 0;
    return currentRoleLevel >= minRoleLevel;
  });

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter((user) => {
      const firstName = user.firstName?.toLowerCase() || '';
      const lastName = user.lastName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return (
        firstName.includes(lowerSearch) ||
        lastName.includes(lowerSearch) ||
        email.includes(lowerSearch)
      );
    });
  }, [users, searchTerm]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  if (!isOpen) return null;

  const canConfirm =
    selectedUserId &&
    selectedRole &&
    (selectedRole !== 'PARENT_FAN' || linkedPlayerId) &&
    !loading;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(
        selectedUserId,
        selectedRole,
        selectedRole === 'PARENT_FAN' ? linkedPlayerId : undefined,
        selectedRole === 'COACH' ? isGuest : undefined
      );
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setSelectedRole('');
    setLinkedPlayerId('');
    setIsGuest(false);
    setSearchTerm('');
    onClose();
  };

  const getUserDisplayName = (user: UserForSelection) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'Unknown User';
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Add Team Member
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Add an existing user to this team with a specific role.
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

        {/* User Search */}
        <div className="mb-4">
          <label
            htmlFor="user-search"
            className="block text-sm font-medium text-gray-700"
          >
            Search User
          </label>
          <input
            type="text"
            id="user-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search by name or email..."
            disabled={loading}
          />
        </div>

        {/* User Selection */}
        <div className="mb-4">
          <label
            htmlFor="user-select"
            className="block text-sm font-medium text-gray-700"
          >
            Select User
          </label>
          <select
            id="user-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">Choose a user...</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {getUserDisplayName(user)}
                {user.email ? ` (${user.email})` : ''}
              </option>
            ))}
          </select>
          {filteredUsers.length === 0 && searchTerm && (
            <p className="mt-2 text-sm text-gray-500">
              No users found matching "{searchTerm}"
            </p>
          )}
        </div>

        {/* Role Selection */}
        {selectedUserId && (
          <div className="mb-4">
            <label
              htmlFor="role-select"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="role-select"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                // Reset dependent fields when role changes
                if (e.target.value !== 'PARENT_FAN') {
                  setLinkedPlayerId('');
                }
                if (e.target.value !== 'COACH') {
                  setIsGuest(false);
                }
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a role...</option>
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Coach Guest Option */}
        {selectedRole === 'COACH' && (
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isGuest}
                onChange={(e) => setIsGuest(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">
                Guest Coach (temporary assignment)
              </span>
            </label>
          </div>
        )}

        {/* Parent/Fan Linked Player Selection */}
        {selectedRole === 'PARENT_FAN' && (
          <div className="mb-4">
            <label
              htmlFor="linked-player"
              className="block text-sm font-medium text-gray-700"
            >
              Linked Player <span className="text-red-500">*</span>
            </label>
            <select
              id="linked-player"
              value={linkedPlayerId}
              onChange={(e) => setLinkedPlayerId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select a player...</option>
              {teamPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Parent/Fan role requires linking to a player on this team.
            </p>
            {teamPlayers.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">
                No players on this team yet. Add players first.
              </p>
            )}
          </div>
        )}

        {/* Selected User Preview */}
        {selectedUser && selectedRole && (
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-600">Adding to team:</p>
            <p className="mt-1 font-medium text-gray-900">
              {getUserDisplayName(selectedUser)}
            </p>
            <p className="text-sm text-gray-500">
              as{' '}
              <span className="font-medium">
                {isGuest ? 'Guest ' : ''}
                {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label ||
                  selectedRole}
              </span>
            </p>
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
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                Adding...
              </span>
            ) : (
              'Add Member'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
