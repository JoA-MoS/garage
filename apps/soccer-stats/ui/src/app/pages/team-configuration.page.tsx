import { useParams } from 'react-router';

import { TeamConfigurationSmart } from '../components/smart/team-configuration.smart';

/**
 * Team configuration page - Set field positions and player count
 */
export const TeamConfigurationPage = () => {
  const { teamId } = useParams<{ teamId: string }>();

  if (!teamId) {
    return <div>Team not found</div>;
  }

  return <TeamConfigurationSmart teamId={teamId} />;
};
