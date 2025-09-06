import { useParams } from 'react-router';

import { TeamManagementSmart } from '../components/smart/team-management.smart';

/**
 * Team settings page - Team configuration within the team layout
 */
export const TeamSettingsPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error: No team ID provided</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Settings</h2>
          <p className="text-gray-600 mt-1">
            Manage your team's basic information, formation, and roster
          </p>
        </div>
      </div>

      <div className="p-0">
        {/* Use the existing team management component but without its own header */}
        <TeamManagementSmart teamId={teamId} isInSettingsMode={true} />
      </div>
    </div>
  );
};
