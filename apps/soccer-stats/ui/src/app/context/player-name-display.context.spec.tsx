import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
} from '@garage/soccer-stats/graphql-codegen';

import {
  DEFAULT_PLAYER_NAME_DISPLAY_CONFIG,
  PlayerNameDisplayProvider,
  usePlayerNameDisplay,
} from './player-name-display.context';

function ConfigProbe() {
  const config = usePlayerNameDisplay();
  return (
    <span>{`${config.format}|${config.showJerseyNumber}|${config.jerseyNumberPosition}`}</span>
  );
}

describe('PlayerNameDisplayContext', () => {
  it('falls back to defaults when no provider wraps the tree', () => {
    render(<ConfigProbe />);

    expect(screen.getByText(/FIRST_LAST/)).toBeTruthy();
  });

  it('exposes the config passed to the provider', () => {
    render(
      <PlayerNameDisplayProvider
        config={{
          format: PlayerNameDisplayFormat.LastCommaFirst,
          showJerseyNumber: false,
          jerseyNumberPosition: JerseyNumberPosition.After,
        }}
      >
        <ConfigProbe />
      </PlayerNameDisplayProvider>,
    );

    expect(screen.getByText('LAST_COMMA_FIRST|false|AFTER')).toBeTruthy();
  });

  it('falls back to defaults when the provider is given a null config', () => {
    render(
      <PlayerNameDisplayProvider config={null}>
        <ConfigProbe />
      </PlayerNameDisplayProvider>,
    );

    expect(
      screen.getByText(
        `${DEFAULT_PLAYER_NAME_DISPLAY_CONFIG.format}|${DEFAULT_PLAYER_NAME_DISPLAY_CONFIG.showJerseyNumber}|${DEFAULT_PLAYER_NAME_DISPLAY_CONFIG.jerseyNumberPosition}`,
      ),
    ).toBeTruthy();
  });
});
