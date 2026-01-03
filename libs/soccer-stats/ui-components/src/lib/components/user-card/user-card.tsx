import { formatDate } from '../../utils';

export interface UserCardProps {
  /** Unique user identifier */
  id: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's email address */
  email: string;
  /** User's phone number */
  phone?: string;
  /** User's date of birth (ISO string) */
  dateOfBirth?: string;
  /** Whether the user is active */
  isActive: boolean;
  /** Number of teams the user belongs to */
  teamCount: number;
  /** Name of the user's primary team */
  primaryTeam?: string;
  /** User's primary playing position */
  primaryPosition?: string;
  /** User's primary jersey number */
  primaryJersey?: string;
  /** Callback when edit button is clicked */
  onEditClick?: () => void;
  /** Callback when view button is clicked */
  onViewClick?: () => void;
  /** Callback when toggle active button is clicked */
  onToggleActiveClick?: () => void;
  /** Whether to show action buttons */
  showActions?: boolean;
}

/**
 * User card component for displaying user information.
 * Mobile-first responsive design with optional action buttons.
 */
export const UserCard = ({
  firstName,
  lastName,
  email,
  phone,
  dateOfBirth,
  isActive,
  teamCount,
  primaryTeam,
  primaryPosition,
  primaryJersey,
  onEditClick,
  onViewClick,
  onToggleActiveClick,
  showActions = true,
}: UserCardProps) => {
  const fullName = `${firstName} ${lastName}`;
  const formattedBirthDate = dateOfBirth ? formatDate(dateOfBirth) : null;

  const cardClass = isActive
    ? 'bg-white border border-gray-200 hover:border-blue-300'
    : 'bg-gray-50 border border-gray-300 hover:border-gray-400';

  const nameClass = isActive
    ? 'font-semibold text-gray-900'
    : 'font-semibold text-gray-500';

  const statusBadgeClass = isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className={`${cardClass} rounded-lg p-4 transition-all duration-200`}>
      <div className="space-y-3">
        {/* Header: Name and Status */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h3 className={`${nameClass} text-lg leading-tight`}>{fullName}</h3>
            <p className="truncate text-sm text-gray-600">{email}</p>
          </div>
          <div className="flex-shrink-0">
            <span
              className={`${statusBadgeClass} rounded-full px-2 py-1 text-xs font-medium`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-sm text-gray-600">
          {phone && (
            <div className="flex items-center space-x-2">
              <span className="h-4 w-4 text-gray-400" aria-hidden="true">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </span>
              <span>{phone}</span>
            </div>
          )}
          {formattedBirthDate && (
            <div className="flex items-center space-x-2">
              <span className="h-4 w-4 text-gray-400" aria-hidden="true">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <span>{formattedBirthDate}</span>
            </div>
          )}
        </div>

        {/* Team Information */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-3 text-sm sm:grid-cols-3">
          <div>
            <span className="block font-medium text-gray-500">Teams</span>
            <span className="text-gray-900">{teamCount}</span>
          </div>
          {primaryTeam && (
            <div className="min-w-0">
              <span className="block font-medium text-gray-500">
                Primary Team
              </span>
              <span className="block truncate text-gray-900">
                {primaryTeam}
              </span>
            </div>
          )}
          {primaryPosition && (
            <div className="col-span-2 sm:col-span-1">
              <span className="block font-medium text-gray-500">Position</span>
              <span className="text-gray-900">
                {primaryJersey && `#${primaryJersey} `}
                {primaryPosition}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col space-y-2 border-t border-gray-200 pt-3 sm:flex-row sm:space-x-2 sm:space-y-0">
            <button
              onClick={onViewClick}
              className="min-h-touch flex-1 transform rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 active:scale-95 active:bg-blue-800 sm:min-h-[36px] lg:hover:bg-blue-700"
            >
              View Details
            </button>
            <button
              onClick={onEditClick}
              className="min-h-touch flex-1 transform rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 active:scale-95 active:bg-gray-800 sm:min-h-[36px] lg:hover:bg-gray-700"
            >
              Edit
            </button>
            <button
              onClick={onToggleActiveClick}
              className={`min-h-touch flex-1 transform rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 active:scale-95 sm:min-h-[36px] ${
                isActive
                  ? 'bg-red-100 text-red-700 active:bg-red-300 lg:hover:bg-red-200'
                  : 'bg-green-100 text-green-700 active:bg-green-300 lg:hover:bg-green-200'
              }`}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
