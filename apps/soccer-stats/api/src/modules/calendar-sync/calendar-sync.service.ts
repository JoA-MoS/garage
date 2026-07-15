import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';

import {
  CalendarProvider,
  CalendarSource,
  CalendarSyncStatus,
} from '../../entities/calendar-source.entity';
import { ExternalGameMapping } from '../../entities/external-game-mapping.entity';
import { Game, GameStatus } from '../../entities/game.entity';
import { GameTeam } from '../../entities/game-team.entity';
import { GameFormat } from '../../entities/game-format.entity';
import { Team, SourceType } from '../../entities/team.entity';
import { TeamConfiguration } from '../../entities/team-configuration.entity';

import {
  ImportedCalendarGame,
  PlayMetricsIcsParserService,
} from './playmetrics-ics-parser.service';

export interface CalendarSyncResult {
  sourceId: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

@Injectable()
export class CalendarSyncService {
  private readonly activeSourceSyncs = new Set<string>();

  constructor(
    @InjectRepository(CalendarSource)
    private readonly calendarSourceRepository: Repository<CalendarSource>,
    @InjectRepository(ExternalGameMapping)
    private readonly externalGameMappingRepository: Repository<ExternalGameMapping>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameTeam)
    private readonly gameTeamRepository: Repository<GameTeam>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(TeamConfiguration)
    private readonly teamConfigurationRepository: Repository<TeamConfiguration>,
    @InjectRepository(GameFormat)
    private readonly gameFormatRepository: Repository<GameFormat>,
    private readonly playMetricsIcsParser: PlayMetricsIcsParserService,
  ) {}

  async createSource(input: {
    teamId: string;
    provider: CalendarProvider;
    feedUrl: string;
    enabled?: boolean;
  }): Promise<CalendarSource> {
    this.validateFeedUrl(input.feedUrl);
    const team = await this.teamRepository.findOne({
      where: { id: input.teamId },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID "${input.teamId}" not found`);
    }

    const source = this.calendarSourceRepository.create({
      teamId: input.teamId,
      provider: input.provider,
      feedUrl: input.feedUrl,
      enabled: input.enabled ?? true,
      lastSyncStatus: CalendarSyncStatus.NEVER_SYNCED,
    });

    return this.calendarSourceRepository.save(source);
  }

  async findSourcesForTeam(teamId: string): Promise<CalendarSource[]> {
    return this.calendarSourceRepository.find({
      where: { teamId },
      order: { createdAt: 'ASC' },
    });
  }

  async syncEnabledSources(): Promise<CalendarSyncResult[]> {
    const sources = await this.calendarSourceRepository.find({
      where: { enabled: true },
    });

    const results: CalendarSyncResult[] = [];
    for (const source of sources) {
      results.push(await this.syncSource(source.id));
    }

    return results;
  }

  async syncSource(
    sourceId: string,
    expectedTeamId?: string,
  ): Promise<CalendarSyncResult> {
    const source = await this.calendarSourceRepository.findOne({
      where: { id: sourceId },
      relations: { team: true },
    });

    if (!source) {
      throw new NotFoundException(
        `Calendar source with ID "${sourceId}" not found`,
      );
    }
    if (expectedTeamId && source.teamId !== expectedTeamId) {
      throw new NotFoundException(
        `Calendar source with ID "${sourceId}" not found for team "${expectedTeamId}"`,
      );
    }
    if (!source.enabled) {
      return { sourceId, created: 0, updated: 0, skipped: 0, errors: [] };
    }

    if (this.activeSourceSyncs.has(sourceId)) {
      return { sourceId, created: 0, updated: 0, skipped: 1, errors: [] };
    }

    this.activeSourceSyncs.add(sourceId);

    const result: CalendarSyncResult = {
      sourceId,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      const ics = await this.fetchFeed(source.feedUrl);
      const parsed = this.parseSourceFeed(source, ics);
      source.calendarName = parsed.calendarName;

      for (const game of parsed.games) {
        try {
          const outcome = await this.upsertGame(source, game);
          result[outcome] += 1;
        } catch (error) {
          result.errors.push(
            `${game.uid}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      source.lastSyncedAt = new Date();
      source.lastSyncStatus =
        result.errors.length > 0
          ? CalendarSyncStatus.ERROR
          : CalendarSyncStatus.SUCCESS;
      source.lastSyncError =
        result.errors.length > 0 ? result.errors.join('\n') : undefined;
      await this.calendarSourceRepository.save(source);

      return result;
    } catch (error) {
      source.lastSyncedAt = new Date();
      source.lastSyncStatus = CalendarSyncStatus.ERROR;
      source.lastSyncError =
        error instanceof Error ? error.message : String(error);
      await this.calendarSourceRepository.save(source);
      throw error;
    } finally {
      this.activeSourceSyncs.delete(sourceId);
    }
  }

  async fetchFeed(feedUrl: string): Promise<string> {
    this.validateFeedUrl(feedUrl);
    const response = await axios.get<string>(feedUrl, {
      responseType: 'text',
      timeout: 15_000,
      maxRedirects: 0,
    });

    return response.data;
  }

  private parseSourceFeed(source: CalendarSource, ics: string) {
    switch (source.provider) {
      case CalendarProvider.PLAYMETRICS:
        return this.playMetricsIcsParser.parse(ics);
      default:
        throw new BadRequestException(
          `Unsupported calendar provider ${source.provider}`,
        );
    }
  }

  private async upsertGame(
    source: CalendarSource,
    imported: ImportedCalendarGame,
  ): Promise<'created' | 'updated' | 'skipped'> {
    const mapping = await this.externalGameMappingRepository.findOne({
      where: {
        calendarSourceId: source.id,
        externalUid: imported.uid,
      },
      relations: { game: true },
    });

    if (mapping?.game) {
      await this.updateMappedGame(mapping, imported);
      return 'updated';
    }

    const managedTeam = source.team ?? (await this.getTeam(source.teamId));
    const opponentTeam = await this.findOrCreateOpponentTeam(source, imported);
    const gameFormat = await this.resolveGameFormat(source.teamId);
    const durationMinutes = this.durationMinutes(
      imported,
      gameFormat.durationMinutes,
    );
    const game = this.gameRepository.create({
      gameFormatId: gameFormat.id,
      name: imported.summary,
      scheduledStart: imported.startsAt,
      venue: imported.location,
      notes: this.buildGameNotes(imported),
      status: this.toGameStatus(imported.status),
      durationMinutes,
    });
    const savedGame = await this.gameRepository.save(game);
    const isManagedHome = imported.homeTeamName === imported.managedTeamName;

    await this.gameTeamRepository.save([
      this.gameTeamRepository.create({
        gameId: savedGame.id,
        teamId: isManagedHome ? managedTeam.id : opponentTeam.id,
        teamType: 'home',
      }),
      this.gameTeamRepository.create({
        gameId: savedGame.id,
        teamId: isManagedHome ? opponentTeam.id : managedTeam.id,
        teamType: 'away',
      }),
    ]);

    await this.externalGameMappingRepository.save(
      this.externalGameMappingRepository.create({
        calendarSourceId: source.id,
        gameId: savedGame.id,
        externalUid: imported.uid,
        externalSequence: imported.sequence,
        externalCreatedAt: imported.created,
        externalLastModified: imported.lastModified,
      }),
    );

    return 'created';
  }

  private async updateMappedGame(
    mapping: ExternalGameMapping,
    imported: ImportedCalendarGame,
  ): Promise<void> {
    const game = mapping.game;
    game.name = imported.summary;
    game.scheduledStart = imported.startsAt;
    game.venue = imported.location;
    game.notes = this.buildGameNotes(imported);
    game.status = this.toGameStatus(imported.status);
    game.durationMinutes = this.durationMinutes(imported, game.durationMinutes);

    await this.gameRepository.save(game);

    mapping.externalSequence = imported.sequence;
    mapping.externalCreatedAt = imported.created;
    mapping.externalLastModified = imported.lastModified;
    await this.externalGameMappingRepository.save(mapping);
  }

  private async findOrCreateOpponentTeam(
    source: CalendarSource,
    imported: ImportedCalendarGame,
  ): Promise<Team> {
    const opponentName = imported.opponentName;
    if (!opponentName) {
      throw new BadRequestException(
        `Unable to parse opponent for event ${imported.uid}`,
      );
    }

    const externalReference = `${source.provider}:${opponentName}`;
    const existing = await this.teamRepository.findOne({
      where: { sourceType: SourceType.EXTERNAL, externalReference },
    });
    if (existing) {
      return existing;
    }

    return this.teamRepository.save(
      this.teamRepository.create({
        name: opponentName,
        isManaged: false,
        sourceType: SourceType.EXTERNAL,
        externalReference,
        isActive: true,
      }),
    );
  }

  private async resolveGameFormat(teamId: string): Promise<GameFormat> {
    const config = await this.teamConfigurationRepository.findOne({
      where: { teamId },
      relations: { defaultGameFormat: true },
    });
    if (config?.defaultGameFormat) {
      return config.defaultGameFormat;
    }
    if (config?.defaultGameFormatId) {
      const format = await this.gameFormatRepository.findOne({
        where: { id: config.defaultGameFormatId },
      });
      if (format) {
        return format;
      }
    }

    const fallback = await this.gameFormatRepository.findOne({
      where: { name: '11v11' },
    });
    if (!fallback) {
      throw new NotFoundException(
        'No default game format found for imported game',
      );
    }

    return fallback;
  }

  private async getTeam(teamId: string): Promise<Team> {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID "${teamId}" not found`);
    }

    return team;
  }

  private buildGameNotes(imported: ImportedCalendarGame): string | undefined {
    const notes = [
      imported.description,
      imported.arrivalTime ? `Arrival: ${imported.arrivalTime}` : undefined,
      imported.uniform ? `Uniform: ${imported.uniform}` : undefined,
      `Imported from calendar UID: ${imported.uid}`,
    ].filter(Boolean);

    return notes.length > 0 ? notes.join('\n\n') : undefined;
  }

  private durationMinutes(
    imported: ImportedCalendarGame,
    fallback?: number,
  ): number | undefined {
    if (imported.endsAt) {
      return Math.max(
        1,
        Math.round(
          (imported.endsAt.getTime() - imported.startsAt.getTime()) / 60_000,
        ),
      );
    }

    return fallback;
  }

  private toGameStatus(status: ImportedCalendarGame['status']): GameStatus {
    return status === 'CANCELLED' ? GameStatus.CANCELLED : GameStatus.SCHEDULED;
  }

  private validateFeedUrl(feedUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(feedUrl);
    } catch {
      throw new BadRequestException('Calendar feed URL must be a valid URL');
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException(
        'PlayMetrics calendar feed URL must use HTTPS',
      );
    }

    if (parsed.hostname !== 'calendar.playmetrics.com') {
      throw new BadRequestException(
        'PlayMetrics calendar feed URL must use calendar.playmetrics.com',
      );
    }
  }
}
