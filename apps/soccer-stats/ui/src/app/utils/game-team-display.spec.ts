import { describe, expect, it } from 'vitest';

import {
  findGameTeam,
  formatGameDate,
  formatGameDateTime,
  getTeamDisplayName,
} from './game-team-display';

describe('game team display helpers', () => {
  const teams = [
    {
      teamType: 'home',
      finalScore: 2,
      team: { name: 'Fierce Jaguars', shortName: 'Jaguars' },
    },
    {
      teamType: 'away',
      finalScore: 1,
      team: { name: 'Seattle United NW B15 Black', shortName: null },
    },
  ];

  it('finds home and away teams from the lowercase API teamType values', () => {
    expect(getTeamDisplayName(findGameTeam(teams, 'home'))).toBe('Jaguars');
    expect(getTeamDisplayName(findGameTeam(teams, 'away'))).toBe(
      'Seattle United NW B15 Black',
    );
  });

  it('also tolerates legacy uppercase teamType values', () => {
    const legacyTeams = teams.map((team) => ({
      ...team,
      teamType: team.teamType.toUpperCase(),
    }));

    expect(getTeamDisplayName(findGameTeam(legacyTeams, 'home'))).toBe('Jaguars');
    expect(getTeamDisplayName(findGameTeam(legacyTeams, 'away'))).toBe(
      'Seattle United NW B15 Black',
    );
  });

  it('uses explicit fallback copy instead of leaking TBD/Team placeholders', () => {
    expect(getTeamDisplayName(undefined)).toBe('Unassigned');
    expect(formatGameDateTime(null)).toBe('Not scheduled');
    expect(formatGameDate('not-a-date')).toBe('');
  });
});
