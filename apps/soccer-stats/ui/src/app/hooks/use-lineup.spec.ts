import { describe, it, expect } from 'vitest';

import { RosterPlayer as GqlRosterPlayer } from '@garage/soccer-stats/graphql-codegen';

import { getPlayerDisplayName } from './use-lineup';

function createPlayer(
  overrides: Partial<GqlRosterPlayer> = {},
): GqlRosterPlayer {
  return {
    gameEventId: 'evt-1',
    ...overrides,
  };
}

describe('getPlayerDisplayName', () => {
  it('should return external player name with number when both are present', () => {
    const player = createPlayer({
      externalPlayerName: 'Guest Player',
      externalPlayerNumber: '10',
    });
    expect(getPlayerDisplayName(player)).toBe('#10 Guest Player');
  });

  it('should return external player name without number when number is missing', () => {
    const player = createPlayer({
      externalPlayerName: 'Guest Player',
    });
    expect(getPlayerDisplayName(player)).toBe('Guest Player');
  });

  it('should return playerName when set and no external name', () => {
    const player = createPlayer({
      playerName: 'John Doe',
    });
    expect(getPlayerDisplayName(player)).toBe('John Doe');
  });

  it('should prefer externalPlayerName over playerName', () => {
    const player = createPlayer({
      externalPlayerName: 'Guest',
      playerName: 'John Doe',
    });
    expect(getPlayerDisplayName(player)).toBe('Guest');
  });

  it('should return "Unknown Player" when no name is available', () => {
    const player = createPlayer({});
    expect(getPlayerDisplayName(player)).toBe('Unknown Player');
  });

  it('should handle null external player number', () => {
    const player = createPlayer({
      externalPlayerName: 'Guest',
      externalPlayerNumber: null,
    });
    expect(getPlayerDisplayName(player)).toBe('Guest');
  });

  it('should handle empty string external player number', () => {
    const player = createPlayer({
      externalPlayerName: 'Guest',
      externalPlayerNumber: '',
    });
    // Empty string is falsy, so no number prefix
    expect(getPlayerDisplayName(player)).toBe('Guest');
  });
});
