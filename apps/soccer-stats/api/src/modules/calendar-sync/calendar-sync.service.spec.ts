import {
  CalendarProvider,
  CalendarSource,
} from '../../entities/calendar-source.entity';
import { ExternalGameMapping } from '../../entities/external-game-mapping.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team, SourceType } from '../../entities/team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';

import { CalendarSyncService } from './calendar-sync.service';
import { PlayMetricsIcsParserService } from './playmetrics-ics-parser.service';

const sampleIcs = `BEGIN:VCALENDAR
X-WR-CALNAME:BU12 Select Airey Games
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:Game_4494939
LAST-MODIFIED:20260706T191149Z
SEQUENCE:1783365109
DTSTART;TZID=America/Los_Angeles:20260710T150000
DTEND;TZID=America/Los_Angeles:20260710T160000
SUMMARY:BU12 Select Airey - Game
DESCRIPTION:BU12 Select Airey at Northshore Select SC BU12C (Cornucopia Game #1)\\nArrive by 2:30 PM\\nUniform: Black Jersey\\, Black Shorts\\, Black Socks\\nNorth Green River Park #4
LOCATION:26352 Green River Rd\\, Kent\\, WA 98030
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

type RepoMock<T> = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock<T, [Partial<T>]>;
  save: jest.Mock;
};

function repo<T>(): RepoMock<T> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((input: Partial<T>) => input as T),
    save: jest.fn(async (input: T | T[]) => input as T),
  };
}

describe('CalendarSyncService', () => {
  const managedTeam = {
    id: 'team-managed',
    name: 'BU12 Select Airey',
    isManaged: true,
    sourceType: SourceType.INTERNAL,
  } as Team;
  const defaultGameFormat = {
    id: 'format-9v9',
    durationMinutes: 60,
  } as GameFormat;
  const source = {
    id: 'source-1',
    teamId: managedTeam.id,
    provider: CalendarProvider.PLAYMETRICS,
    feedUrl:
      'https://calendar.playmetrics.com/calendars/c755/t537361/p0/tF6BE3E68/f/games-calendar.ics',
    enabled: true,
    team: managedTeam,
  } as CalendarSource;

  let calendarSourceRepo: RepoMock<CalendarSource>;
  let mappingRepo: RepoMock<ExternalGameMapping>;
  let gameRepo: RepoMock<Game>;
  let gameTeamRepo: RepoMock<GameTeam>;
  let teamRepo: RepoMock<Team>;
  let teamConfigRepo: RepoMock<TeamConfiguration>;
  let gameFormatRepo: RepoMock<GameFormat>;
  let service: CalendarSyncService;

  beforeEach(() => {
    calendarSourceRepo = repo<CalendarSource>();
    mappingRepo = repo<ExternalGameMapping>();
    gameRepo = repo<Game>();
    gameTeamRepo = repo<GameTeam>();
    teamRepo = repo<Team>();
    teamConfigRepo = repo<TeamConfiguration>();
    gameFormatRepo = repo<GameFormat>();

    calendarSourceRepo.findOne.mockResolvedValue(source);
    mappingRepo.findOne.mockResolvedValue(null);
    teamConfigRepo.findOne.mockResolvedValue({
      defaultGameFormatId: defaultGameFormat.id,
      defaultGameDuration: 60,
      statsFeatures: { trackGoals: true },
    });
    gameFormatRepo.findOne.mockResolvedValue(defaultGameFormat);
    teamRepo.findOne.mockResolvedValueOnce(null);
    teamRepo.save.mockImplementation(async (team) =>
      Object.assign(team as Team, { id: 'team-opponent' }),
    );
    gameRepo.save.mockImplementation(async (game) =>
      Object.assign(game as Game, { id: 'game-1' }),
    );

    service = new CalendarSyncService(
      calendarSourceRepo as never,
      mappingRepo as never,
      gameRepo as never,
      gameTeamRepo as never,
      teamRepo as never,
      teamConfigRepo as never,
      gameFormatRepo as never,
      new PlayMetricsIcsParserService(),
    );
    jest.spyOn(service, 'fetchFeed').mockResolvedValue(sampleIcs);
  });

  it('creates a scheduled game, opponent team, game teams, and mapping from a PlayMetrics feed', async () => {
    const result = await service.syncSource(source.id);

    expect(result).toMatchObject({ created: 1, updated: 0, skipped: 0 });
    expect(teamRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Northshore Select SC BU12C',
        isManaged: false,
        sourceType: SourceType.EXTERNAL,
        externalReference: 'playmetrics:Northshore Select SC BU12C',
      }),
    );
    expect(gameRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gameFormatId: defaultGameFormat.id,
        name: 'BU12 Select Airey - Game',
        scheduledStart: new Date('2026-07-10T22:00:00.000Z'),
        venue: '26352 Green River Rd, Kent, WA 98030',
        status: GameStatus.SCHEDULED,
        durationMinutes: 60,
      }),
    );
    expect(gameTeamRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({
        gameId: 'game-1',
        teamId: 'team-opponent',
        teamType: 'home',
      }),
      expect.objectContaining({
        gameId: 'game-1',
        teamId: managedTeam.id,
        teamType: 'away',
      }),
    ]);
    expect(mappingRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarSourceId: source.id,
        gameId: 'game-1',
        externalUid: 'Game_4494939',
        externalSequence: 1783365109,
      }),
    );
  });

  it('updates an existing mapped game when PlayMetrics changes the event', async () => {
    const existingGame = {
      id: 'game-existing',
      status: GameStatus.SCHEDULED,
    } as Game;
    mappingRepo.findOne.mockResolvedValue({
      id: 'mapping-1',
      gameId: existingGame.id,
      game: existingGame,
      externalUid: 'Game_4494939',
      externalSequence: 1,
    } as ExternalGameMapping);

    const result = await service.syncSource(source.id);

    expect(result).toMatchObject({ created: 0, updated: 1, skipped: 0 });
    expect(gameRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: existingGame.id,
        scheduledStart: new Date('2026-07-10T22:00:00.000Z'),
        venue: '26352 Green River Rd, Kent, WA 98030',
      }),
    );
  });

  it('syncs all enabled calendar sources for scheduled automation', async () => {
    const secondSource = { ...source, id: 'source-2' } as CalendarSource;
    calendarSourceRepo.find.mockResolvedValue([source, secondSource]);
    calendarSourceRepo.findOne
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(secondSource);

    const results = await service.syncEnabledSources();

    expect(calendarSourceRepo.find).toHaveBeenCalledWith({
      where: { enabled: true },
    });
    expect(results).toHaveLength(2);
    expect(service.fetchFeed).toHaveBeenCalledTimes(2);
  });

  it('rejects non-PlayMetrics calendar URLs before saving a source', async () => {
    await expect(
      service.createSource({
        teamId: managedTeam.id,
        provider: CalendarProvider.PLAYMETRICS,
        feedUrl: 'http://169.254.169.254/latest/meta-data',
      }),
    ).rejects.toThrow('PlayMetrics calendar feed URL must use HTTPS');
  });
});
