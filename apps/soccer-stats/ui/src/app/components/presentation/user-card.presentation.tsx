import { formatDate } from '../../utils';

/**
 * Layer 1: Pure Presentation Component
 * Simple user card for displaying user information
 * Mobile-first responsive design
 */

interface UserCardPresentationProps {
  // Basic user info
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  isActive: boolean;

  // Team info
  teamCount: number;
  primaryTeam?: string;
  primaryPosition?: string;
  primaryJersey?: string;

  // Event handlers
  onEditClick?: () => void;
  onViewClick?: () => void;
  onToggleActiveClick?: () => void;

  // UI state
  showActions?: boolean;
}

export const UserCardPresentation = ({
  id,
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
}: UserCardPresentationProps) => {
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
      {/* Mobile-first responsive design */}
      <div className="space-y-3">
        {/* Header: Name and Status */}
        <div
          className="
          flex flex-col space-y-2
          sm:flex-row sm:items-start sm:justify-between sm:space-y-0
        "
        >
          <div className="min-w-0 flex-1">
            <h3 className={`${nameClass} text-lg leading-tight`}>{fullName}</h3>
            <p className="truncate text-sm text-gray-600">{email}</p>
          </div>
          <div className="flex-shrink-0">
            <span
              className={`
              ${statusBadgeClass} rounded-full px-2 py-1 text-xs font-medium
            `}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-sm text-gray-600">
          {phone && (
            <div className="flex items-center space-x-2">
              <span
                className="h-4 w-4 text-gray-400"
                role="img"
                aria-label="phone"
              >
                📞
              </span>
              <span>{phone}</span>
            </div>
          )}
          {formattedBirthDate && (
            <div className="flex items-center space-x-2">
              <span
                className="h-4 w-4 text-gray-400"
                role="img"
                aria-label="birthday"
              >
                🎂
              </span>
              <span>{formattedBirthDate}</span>
            </div>
          )}
        </div>

        {/* Team Information */}
        <div
          className="
          grid grid-cols-2 gap-4
          border-t border-gray-200 pt-3 text-sm
          sm:grid-cols-3
        "
        >
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
            <div
              className="
              col-span-2 sm:col-span-1
            "
            >
              <span className="block font-medium text-gray-500">Position</span>
              <span className="text-gray-900">
                {primaryJersey && `#${primaryJersey} `}
                {primaryPosition}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - Mobile-first touch targets */}
        {showActions && (
          <div
            className="
            flex flex-col space-y-2
            border-t border-gray-200 pt-3
            sm:flex-row sm:space-x-2 sm:space-y-0
          "
          >
            <button
              onClick={onViewClick}
              className="
                min-h-[40px] flex-1 transform rounded-md bg-blue-600 px-3 py-2 text-sm
                font-medium text-white
                transition-colors duration-200
                hover:bg-blue-700
                active:scale-95 active:bg-blue-800
                sm:min-h-[36px]
              "
            >
              View Details
            </button>
            <button
              onClick={onEditClick}
              className="
                min-h-[40px] flex-1 transform rounded-md bg-gray-600 px-3 py-2 text-sm
                font-medium text-white
                transition-colors duration-200
                hover:bg-gray-700
                active:scale-95 active:bg-gray-800
                sm:min-h-[36px]
              "
            >
              Edit
            </button>
            <button
              onClick={onToggleActiveClick}
              className={`
                min-h-[40px] flex-1 transform rounded-md px-3 py-2
                text-sm font-medium
                transition-colors
                duration-200 active:scale-95
                sm:min-h-[36px]
                ${
                  isActive
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
                }
              `}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
