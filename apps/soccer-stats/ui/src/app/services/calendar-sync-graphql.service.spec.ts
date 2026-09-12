import { describe, expect, it } from 'vitest';

import { inferCalendarProvider } from './calendar-sync-graphql.service';

describe('inferCalendarProvider', () => {
  it('uses SportsEngine for sportngin webcal feeds', () => {
    expect(
      inferCalendarProvider(
        'webcal://ical.sportngin.com/v3/calendar/ical?team_ids=11f19d16-09d7-1662-bd23-b217320f2008',
      ),
    ).toBe('SPORTSENGINE');
  });

  it('uses SportsEngine for sportngin HTTPS feeds', () => {
    expect(
      inferCalendarProvider(
        'https://ical.sportngin.com/v3/calendar/ical?team_ids=team-1',
      ),
    ).toBe('SPORTSENGINE');
  });

  it('defaults to PlayMetrics for existing calendar feeds', () => {
    expect(
      inferCalendarProvider(
        'https://calendar.playmetrics.com/calendars/team/games-calendar.ics',
      ),
    ).toBe('PLAYMETRICS');
  });
});
