import { useParams } from 'react-router';

import { EditTeamSmart } from '../components/smart/edit-team.smart';

/**
 * Edit team page - Modify existing team information
 */
export const EditTeamPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: No team ID provided</p>
        </div>
      </div>
    );
  }

  return <EditTeamSmart teamId={teamId} />;
};
