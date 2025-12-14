import { Team } from '../../types';
import { RosterViewPresentation } from '../presentation/roster-view.presentation';

interface RosterViewSmartProps {
  homeTeam: Team;
  awayTeam: Team;
  homeTeamName: string;
  awayTeamName: string;
}

export const RosterViewSmart = ({
  homeTeam,
  awayTeam,
  homeTeamName,
  awayTeamName,
}: RosterViewSmartProps) => {
  // For now, this is a simple pass-through smart component
  // In the future, we could add:
  // - Data fetching for player photos
  // - Analytics tracking for which players parents view most
  // - Favorites/bookmarking functionality

  return (
    <RosterViewPresentation
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
    />
  );
};
