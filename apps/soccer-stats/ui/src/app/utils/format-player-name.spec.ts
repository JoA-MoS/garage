import { describe, expect, it } from 'vitest';

import {
  formatJerseyDisplay,
  formatPlayerName,
  type PlayerNameDisplayFormat,
} from './format-player-name';

describe('formatPlayerName', () => {
  const player = { firstName: 'Justin', lastName: 'Dietz' };

  const cases: Array<[PlayerNameDisplayFormat, string]> = [
    ['FIRST_NAME', 'Justin'],
    ['LAST_NAME', 'Dietz'],
    ['FIRST_LAST', 'Justin Dietz'],
    ['LAST_COMMA_FIRST', 'Dietz, Justin'],
    ['FIRST_LASTINITIAL', 'Justin D.'],
    ['FIRSTINITIAL_LASTINITIAL', 'J.D.'],
    ['FIRSTINITIAL_LAST', 'J. Dietz'],
  ];

  it.each(cases)('formats %s as "%s"', (format, expected) => {
    expect(formatPlayerName(player, format)).toBe(expected);
  });

  describe('when lastName is missing (e.g. privacy-restricted player)', () => {
    const noLastName = { firstName: 'Justin', lastName: null };

    const fallbackCases: Array<[PlayerNameDisplayFormat, string]> = [
      ['FIRST_NAME', 'Justin'],
      ['LAST_NAME', 'Justin'],
      ['FIRST_LAST', 'Justin'],
      ['LAST_COMMA_FIRST', 'Justin'],
      ['FIRST_LASTINITIAL', 'Justin'],
      ['FIRSTINITIAL_LASTINITIAL', 'J.'],
      ['FIRSTINITIAL_LAST', 'J.'],
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
      formatPlayerName({ firstName: null, lastName: null }, 'FIRST_LAST'),
    ).toBe('');
  });

  it('trims whitespace-only names as if they were missing', () => {
    expect(
      formatPlayerName({ firstName: 'Justin', lastName: '  ' }, 'FIRST_LAST'),
    ).toBe('Justin');
  });
});

describe('formatJerseyDisplay', () => {
  it('prefixes the jersey number before the name when position is BEFORE', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: true,
        jerseyNumberPosition: 'BEFORE',
      }),
    ).toBe('#7 Justin Dietz');
  });

  it('suffixes the jersey number after the name when position is AFTER', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: true,
        jerseyNumberPosition: 'AFTER',
      }),
    ).toBe('Justin Dietz #7');
  });

  it('omits the jersey number when showJerseyNumber is false', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', '7', {
        showJerseyNumber: false,
        jerseyNumberPosition: 'BEFORE',
      }),
    ).toBe('Justin Dietz');
  });

  it('omits the jersey number when none is available', () => {
    expect(
      formatJerseyDisplay('Justin Dietz', null, {
        showJerseyNumber: true,
        jerseyNumberPosition: 'BEFORE',
      }),
    ).toBe('Justin Dietz');
  });
});
