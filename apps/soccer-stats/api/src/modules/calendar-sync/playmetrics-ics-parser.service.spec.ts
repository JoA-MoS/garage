import { PlayMetricsIcsParserService } from './playmetrics-ics-parser.service';

const gamesCalendarIcs = `BEGIN:VCALENDAR
PRODID:-//PlayMetrics//EN
VERSION:2.0
TZID:America/Los_Angeles
X-WR-CALNAME:BU12 Select Airey Games
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:Game_4494939
DTSTAMP:20260712T163101Z
CREATED:20260706T190035Z
LAST-MODIFIED:20260706T191149Z
SEQUENCE:1783365109
DTSTART;TZID=America/Los_Angeles:20260710T150000
DTEND;TZID=America/Los_Angeles:20260710T160000
SUMMARY:BU12 Select Airey - Game
DESCRIPTION:BU12 Select Airey at Northshore Select SC BU12C (Cornucopia Game #1)\\nArrive by 2:30 PM\\nUniform: Black Jersey\\, Black Shorts\\, Black Socks\\nNorth Green River Park #4
LOCATION:26352 Green River Rd\\, Kent\\, WA 98030
STATUS:CONFIRMED
URL:https://playmetrics.com
END:VEVENT
END:VCALENDAR`;

const sportsEngineCalendarIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//sportsengine.com//ical-feed-v2//EN
NAME:Legacy FC
X-WR-CALNAME:Legacy FC
BEGIN:VEVENT
UID:273bb15c-fb78-4410-9286-8b0110dc4ec0@sportsengine.com
SEQUENCE:1787677103
DTSTAMP:20260825T165823Z
DTSTART;TZID=America/Los_Angeles:20260825T183000
DTEND;TZID=America/Los_Angeles:20260825T193000
SUMMARY:Practice
LOCATION:16022 116th Ave SE\\, Renton\\, WA 98058\\, US
END:VEVENT
BEGIN:VEVENT
UID:287b2291-c0fd-4081-9f94-7911b666ab92@sportsengine.com
SEQUENCE:1788557788
DTSTAMP:20260904T213628Z
DTSTART;TZID=America/Los_Angeles:20260912T090000
DTEND;TZID=America/Los_Angeles:20260912T100000
SUMMARY:Victory FC at Legacy FC
LOCATION:16022 116th Ave SE\\, Renton\\, WA 98058\\, USA\\, Renton\\, WA\\, 9805
 8\\, United States
DESCRIPTION:https://sportsengine.app.link/?type%3Dgame
END:VEVENT
END:VCALENDAR`;

describe('PlayMetricsIcsParserService', () => {
  let service: PlayMetricsIcsParserService;

  beforeEach(() => {
    service = new PlayMetricsIcsParserService();
  });

  it('parses PlayMetrics game events with timezone-aware dates and structured details', () => {
    const result = service.parse(gamesCalendarIcs);

    expect(result.calendarName).toBe('BU12 Select Airey Games');
    expect(result.refreshTtl).toBe('PT1H');
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toMatchObject({
      uid: 'Game_4494939',
      sequence: 1783365109,
      summary: 'BU12 Select Airey - Game',
      location: '26352 Green River Rd, Kent, WA 98030',
      status: 'CONFIRMED',
      managedTeamName: 'BU12 Select Airey',
      opponentName: 'Northshore Select SC BU12C',
      homeTeamName: 'Northshore Select SC BU12C',
      awayTeamName: 'BU12 Select Airey',
      arrivalTime: '2:30 PM',
      uniform: 'Black Jersey, Black Shorts, Black Socks',
    });
    expect(result.games[0].startsAt.toISOString()).toBe(
      '2026-07-10T22:00:00.000Z',
    );
    expect(result.games[0].endsAt?.toISOString()).toBe(
      '2026-07-10T23:00:00.000Z',
    );
    expect(result.games[0].lastModified?.toISOString()).toBe(
      '2026-07-06T19:11:49.000Z',
    );
  });

  it('ignores non-game events from a full team calendar feed', () => {
    const ics = gamesCalendarIcs
      .replace('UID:Game_4494939', 'UID:Practice_11051396')
      .replace(
        'SUMMARY:BU12 Select Airey - Game',
        'SUMMARY:BU12 Select Airey - Practice',
      );

    expect(service.parse(ics).games).toHaveLength(0);
  });

  it('parses SportsEngine game events and ignores practices', () => {
    const result = service.parseSportsEngine(sportsEngineCalendarIcs);

    expect(result.calendarName).toBe('Legacy FC');
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toMatchObject({
      uid: '287b2291-c0fd-4081-9f94-7911b666ab92@sportsengine.com',
      sequence: 1788557788,
      summary: 'Victory FC at Legacy FC',
      location:
        '16022 116th Ave SE, Renton, WA 98058, USA, Renton, WA, 98058, United States',
      status: 'CONFIRMED',
      managedTeamName: 'Legacy FC',
      opponentName: 'Victory FC',
      homeTeamName: 'Legacy FC',
      awayTeamName: 'Victory FC',
    });
    expect(result.games[0].startsAt.toISOString()).toBe(
      '2026-09-12T16:00:00.000Z',
    );
    expect(result.games[0].endsAt?.toISOString()).toBe(
      '2026-09-12T17:00:00.000Z',
    );
  });

  it('does not emit NaN for malformed sequence values', () => {
    const ics = gamesCalendarIcs.replace(
      'SEQUENCE:1783365109',
      'SEQUENCE:not-a-number',
    );

    expect(service.parse(ics).games[0].sequence).toBeUndefined();
  });
});
