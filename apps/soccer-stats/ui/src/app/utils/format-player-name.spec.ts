import { describe, expect, it } from 'vitest';

import {
  JerseyNumberPosition,
  PlayerNameDisplayFormat,
} from '@garage/soccer-stats/graphql-codegen';

import {
  formatJerseyDisplay,
  formatPlayerName,
} from './format-player-name';

describe('formatPlayerName', () => {
  const player = { firstName: 'Justin', lastName: 'Dietz' };

  const cases: Array<[PlayerNameDisplayFormat, string]> = [
    [PlayerNameDisplayFormat.FirstName, 'Justin'],
    [PlayerNameDisplayFormat.LastName, 'Dietz'],
    [PlayerNameDisplayFormat.FirstLast, 'Justin Dietz'],
    [PlayerNameDisplayFormat.LastCommaFirst, 'Dietz, Justin'],
    [PlayerNameDisplayFormat.FirstLastinitial, 'Justin D.'],
    [PlayerNameDisplayFormat.FirstinitialLastinitial, 'J.D.'],
    [PlayerNameDisplayFormat.FirstinitialLast, 'J. Dietz'],
  ];

  it.each(cases)('formats %s as "%s"', (format, expected) => {
    expect(formatPlayerName(player, format)).toBe(expected);
  });

  describe('when lastName is missing (e.g. privacy-restricted player)', () => {
    const noLastName = { firstName: 'Justin', lastName: null };

    const fallbackCases: Array<[PlayerNameDisplayFormat, string]> = [
      [PlayerNameDisplayFormat.FirstName, 'Justin'],
      [PlayerNameDisplayFormat.LastName, 'Justin'],
      [PlayerNameDisplayFormat.FirstLast, 'Justin'],
      [PlayerNameDisplayFormat.LastCommaFirst, 'Justin'],
      [PlayerNameDisplayFormat.FirstLastinitial, 'Justin'],
      [PlayerNameDisplayFormat.FirstinitialLastinitial, 'J.'],
      [PlayerNameDisplayFormat.FirstinitialLast, 'J.'],
    ];

    it.each(fallbackCases)(
      'degrades %s to "%s" instead of leaking a partial/missing last name',
      (format, expected) => {
        expect(formatPlayerName(noLastName, format)).toBe(expected);
      },
    );
  });

  it('returns an empty string when both names are missing', () => {
    expect(
      formatPlayerName({ firstName: null, lastName: null }, PlayerNameDisplayFormat.FirstLast),
    ).toBe('');
  });

  it('trims whitespace-only names as if they were missing', () => {
    expect(
      formatPlayerName({ firstName: 'Justin', lastName: '  ' }, PlayerNameDisplayFormat.FirstLast),
    ).toBe('Justin');
  });
});

describe('formatJerseyDisplay', () => {
  it('prefixes the jersey number before the name when position is BEFORE', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: true,
        jerseyNumberPosition: JerseyNumberPosition.Before,
      }),
    ).toBe('#7 Justin Dietz');
  });

  it('suffixes the jersey number after the name when position is AFTER', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: true,
        jerseyNumberPosition: JerseyNumberPosition.After,
      }),
    ).toBe('Justin Dietz #7');
  });

  it('omits the jersey number when showJerseyNumber is false', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: false,
        jerseyNumberPosition: JerseyNumberPosition.Before,
      }),
    ).toBe('Justin Dietz');
  });

  it('omits the jersey number when none is available', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', null, {
        showJerseyNumber: true,
        jerseyNumberPosition: JerseyNumberPosition.Before,
      }),
    ).toBe('Justin Dietz');
  });
});
