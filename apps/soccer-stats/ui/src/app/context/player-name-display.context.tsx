import { createContext, useContext, ReactNode } from 'react';

import type {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
} from '../services/teams-graphql.service';

export interface PlayerNameDisplayConfig {
  format: PlayerNameDisplayFormat;
  showJerseyNumber: boolean;
  jerseyNumberPosition: JerseyNumberPosition;
}

export const DEFAULT_PLAYER_NAME_DISPLAY_CONFIG: PlayerNameDisplayConfig = {
  format: 'FIRST_LAST',
  showJerseyNumber: true,
  jerseyNumberPosition: 'BEFORE',
};

const PlayerNameDisplayContext = createContext<PlayerNameDisplayConfig>(
  DEFAULT_PLAYER_NAME_DISPLAY_CONFIG,
);

interface PlayerNameDisplayProviderProps {
  /** The active team's configuration; falls back to defaults when unset. */
  config?: PlayerNameDisplayConfig | null;
  children: ReactNode;
}

/**
 * Provides the active team's player name display preferences to the game
 * display tree, avoiding prop-drilling through every intermediate lineup/
 * substitution/stats component. Defaults apply outside a provider (e.g. in
 * isolated component tests) rather than throwing, since this is a display
 * preference, not required page state.
 */
export const PlayerNameDisplayProvider = ({
  config,
  children,
}: PlayerNameDisplayProviderProps) => (
  <PlayerNameDisplayContext.Provider
    value={config ?? DEFAULT_PLAYER_NAME_DISPLAY_CONFIG}
  >
    {children}
  </PlayerNameDisplayContext.Provider>
);

export const usePlayerNameDisplay = (): PlayerNameDisplayConfig =>
  useContext(PlayerNameDisplayContext);
