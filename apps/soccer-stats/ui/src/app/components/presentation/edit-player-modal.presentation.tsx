import { useState } from 'react';

interface TeamPlayer {
  id: string;
  jerseyNumber?: string | null;
  primaryPosition?: string | null;
  isActive: boolean;
  joinedDate?: string | null;
  leftDate?: string | null;
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

interface EditPlayerModalProps {
  player: TeamPlayer;
  onClose: () => void;
  onSubmit: (updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jerseyNumber?: string;
    primaryPosition?: string;
    isActive?: boolean;
  }) => Promise<void>;
  loading: boolean;
  teamColor: string;
}

const POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Left Back',
  'Right Back',
  'Center Back',
  'Midfielder',
  'Left Midfielder',
  'Right Midfielder',
  'Central Midfielder',
  'Defensive Midfielder',
  'Attacking Midfielder',
  'Forward',
  'Left Wing',
  'Right Wing',
  'Striker',
];

export const EditPlayerModal = ({
  player,
  onClose,
  onSubmit,
  loading,
  teamColor,
}: EditPlayerModalProps) => {
  const [firstName, setFirstName] = useState(player.user.firstName || '');
  const [lastName, setLastName] = useState(player.user.lastName || '');
  const [email, setEmail] = useState(player.user.email || '');
  const [phone, setPhone] = useState(player.user.phone || '');
  const [jerseyNumber, setJerseyNumber] = useState(player.jerseyNumber || '');
  const [primaryPosition, setPrimaryPosition] = useState(
    player.primaryPosition || 'Midfielder'
  );
  const [isActive, setIsActive] = useState(player.isActive);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!jerseyNumber.trim()) {
      setError('Jersey number is required');
      return;
    }

    const jerseyNum = parseInt(jerseyNumber, 10);
    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      setError('Jersey number must be between 1 and 99');
      return;
    }

    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        jerseyNumber: jerseyNumber.trim(),
        primaryPosition,
        isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player');
    }
  };

  const hasChanges =
    firstName !== (player.user.firstName || '') ||
    lastName !== (player.user.lastName || '') ||
    email !== (player.user.email || '') ||
    phone !== (player.user.phone || '') ||
    jerseyNumber !== (player.jerseyNumber || '') ||
    primaryPosition !== (player.primaryPosition || 'Midfielder') ||
    isActive !== player.isActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit Player</h3>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
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
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Jersey Preview */}
          <div className="mb-6 flex justify-center">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${
                !isActive ? 'opacity-50' : ''
              }`}
              style={{ backgroundColor: teamColor }}
            >
              {jerseyNumber || '?'}
            </div>
          </div>

          <div className="space-y-4">
            {/* Active Status Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <span className="font-medium text-gray-900">Active Status</span>
                <p className="text-sm text-gray-500">
                  {isActive
                    ? 'Player is active on the team'
                    : 'Player is inactive'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="(optional)"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Jersey and Position Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="jerseyNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Jersey Number *
                </label>
                <input
                  id="jerseyNumber"
                  type="number"
                  min="1"
                  max="99"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="primaryPosition"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Position
                </label>
                <select
                  id="primaryPosition"
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
