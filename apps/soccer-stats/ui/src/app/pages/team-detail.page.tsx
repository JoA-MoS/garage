import { useParams } from 'react-router';

// import { TeamDetailSmart } from '../components/smart/team-detail.smart';

/**
 * Team detail page - View team information and statistics
 */
export const TeamDetailPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: No team ID provided</p>
        </div>
      </div>
    );
  }

  // return <TeamDetailSmart teamId={teamId} />;
};
