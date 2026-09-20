import { usePlayerNameDisplay } from '../../context/player-name-display.context';
import {
  PlayerCard,
  type PlayerCardProps,
} from '../presentation/player-card.presentation';

export type PlayerCardConnectedProps = Omit<PlayerCardProps, 'nameDisplayConfig'>;

/**
 * Smart wrapper for {@link PlayerCard} that reads the active team's display
 * preferences from {@link PlayerNameDisplayProvider} context and passes them
 * as props. Use this wherever the game-page context tree is present; use
 * {@link PlayerCard} directly (with an explicit `nameDisplayConfig` prop) in
 * isolated contexts such as Storybook stories and unit tests.
 */
export function PlayerCardConnected(props: PlayerCardConnectedProps) {
  const nameDisplayConfig = usePlayerNameDisplay();
  return <PlayerCard {...props} nameDisplayConfig={nameDisplayConfig} />;
}
