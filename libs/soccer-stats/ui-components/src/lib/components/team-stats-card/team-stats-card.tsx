export interface TeamStatsCardTeam {
  /** Team identifier (optional - only needed for keying) */
  id?: string;
  /** Team display name */
  name: string;
}

export interface TeamStatsCardProps {
  /** Team information */
  team: TeamStatsCardTeam;
  /** Whether this is home or away team */
  teamType: 'home' | 'away';
  /** Number of goals scored */
  goals: number;
  /** Number of assists */
  assists: number;
  /** Number of players currently on field */
  playersOnField: number;
}

/**
 * Card component displaying team statistics during a game.
 * Shows goals, assists, and players on field with color-coded header.
 */
export const TeamStatsCard = ({
  team,
  teamType,
  goals,
  assists,
  playersOnField,
}: TeamStatsCardProps) => {
  const headerColorClass =
    teamType === 'home' ? 'text-blue-700' : 'text-red-700';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className={`mb-4 text-lg font-semibold ${headerColorClass}`}>
        {team.name} Statistics
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Goals:</span>
          <span className="font-semibold text-blue-600">{goals}</span>
        </div>
        <div className="flex justify-between">
          <span>Assists:</span>
          <span className="font-semibold text-purple-600">{assists}</span>
        </div>
        <div className="flex justify-between">
          <span>Players on Field:</span>
          <span className="font-semibold">{playersOnField}</span>
        </div>
      </div>
    </div>
  );
};
