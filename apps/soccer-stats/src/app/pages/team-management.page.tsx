import { useParams } from 'react-router';

import { TeamManagementSmart } from '../components/smart/team-management.smart';

/**
 * Team management page - Unified interface for creating/editing teams with tabs
 */
export const TeamManagementPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  return <TeamManagementSmart teamId={teamId} />;
};
