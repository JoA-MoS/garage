import { Player, SubstitutionRecommendation, Team } from '../../types';
import { formatTime } from '../../utils';
import { SubstitutionsTabPresentation } from '../presentation/substitutions-tab.presentation';

interface SubstitutionsTabSmartProps {
  team: Team;
  gameTime: number;
  onSubstitute: (playerOutId: number, playerInId: number) => void;
}

/**
 * Smart component that calculates substitution recommendations and manages substitution logic
 */
export const SubstitutionsTabSmart = ({
  team,
  gameTime,
  onSubstitute,
}: SubstitutionsTabSmartProps) => {
  // Filter players by status
  const playersOnField = team.players.filter((p) => p.isOnField);
  const playersOnBench = team.players.filter((p) => !p.isOnField);

  // Generate substitution recommendations (this logic will be moved to a service in the future)
  const getSubstitutionRecommendations = (): SubstitutionRecommendation[] => {
    const recommendations: SubstitutionRecommendation[] = [];

    // Find tired players (high play time)
    const avgPlayTime =
      playersOnField.reduce((sum, p) => sum + p.playTime, 0) /
      playersOnField.length;
    const tiredPlayers = playersOnField.filter(
      (p) => p.playTime > avgPlayTime * 1.3
    );

    tiredPlayers.forEach((tiredPlayer) => {
      const replacement = playersOnBench
        .filter((p) => p.position === tiredPlayer.position)
        .sort((a, b) => a.playTime - b.playTime)[0];

      if (replacement) {
        recommendations.push({
          playerOut: tiredPlayer,
          playerIn: replacement,
          reason: `Rest tired player - ${formatTime(
            tiredPlayer.playTime
          )} played`,
        });
      }
    });

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  };

  const substitutionRecommendations = getSubstitutionRecommendations();

  return (
    <SubstitutionsTabPresentation
      substitutionRecommendations={substitutionRecommendations}
      playersOnField={playersOnField}
      playersOnBench={playersOnBench}
      onSubstitute={onSubstitute}
    />
  );
};
