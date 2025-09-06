import { CreatePlayerInput } from '../../services/players-graphql.service';

interface CreatePlayerPresentationProps {
  formData: CreatePlayerInput;
  loading: boolean;
  error?: string;
  isFormValid: boolean;
  onInputChange: (field: keyof CreatePlayerInput, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

/**
 * Presentation component for creating a new player
 */
export const CreatePlayerPresentation = ({
  formData,
  loading,
  error,
  isFormValid,
  onInputChange,
  onSubmit,
  onCancel,
}: CreatePlayerPresentationProps) => {
  const positions = [
    'Goalkeeper',
    'Right Back',
    'Center Back',
    'Left Back',
    'Defensive Midfielder',
    'Center Midfielder',
    'Attacking Midfielder',
    'Right Winger',
    'Left Winger',
    'Center Forward',
    'Striker',
  ];

  return (
    <div
      className="
      max-w-md mx-auto bg-white rounded-lg shadow-md p-6
      mobile-first: p-4
      sm:p-6
      md:max-w-lg
    "
    >
      <h2
        className="
        text-xl font-bold text-gray-900 mb-6 text-center
        sm:text-2xl
      "
      >
        Create New Player
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label
            htmlFor="player-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Player Name *
          </label>
          <input
            id="player-name"
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="Enter player name"
            disabled={loading}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              min-h-[44px]
            "
            required
          />
        </div>

        {/* Position Select */}
        <div>
          <label
            htmlFor="player-position"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Position *
          </label>
          <select
            id="player-position"
            value={formData.position}
            onChange={(e) => onInputChange('position', e.target.value)}
            disabled={loading}
            className="
              w-full px-3 py-2 border border-gray-300 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              min-h-[44px]
            "
            required
          >
            <option value="">Select a position</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="
            bg-red-50 border border-red-200 rounded-md p-3
            text-red-800 text-sm
          "
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="
          flex flex-col gap-3 pt-4
          sm:flex-row sm:justify-end sm:gap-4
        "
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              min-h-[44px] px-4 py-2 border border-gray-300 rounded-md
              text-gray-700 bg-white hover:bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              sm:order-1
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="
              min-h-[44px] px-6 py-2 bg-blue-600 text-white rounded-md
              hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              sm:order-2
            "
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Creating...
              </span>
            ) : (
              'Create Player'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
