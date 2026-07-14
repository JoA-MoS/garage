import { Injectable } from '@nestjs/common';

export type ImportedCalendarGameStatus =
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'TENTATIVE';

export interface ImportedCalendarGame {
  uid: string;
  sequence?: number;
  created?: Date;
  lastModified?: Date;
  startsAt: Date;
  endsAt?: Date;
  summary: string;
  description?: string;
  location?: string;
  status: ImportedCalendarGameStatus;
  managedTeamName?: string;
  opponentName?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  arrivalTime?: string;
  uniform?: string;
}

export interface ParsedCalendarFeed {
  calendarName?: string;
  refreshTtl?: string;
  timezone?: string;
  games: ImportedCalendarGame[];
}

interface IcsProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

@Injectable()
export class PlayMetricsIcsParserService {
  parse(ics: string): ParsedCalendarFeed {
    const unfolded = this.unfoldLines(ics);
    const calendarProps = this.parseProperties(this.calendarLines(unfolded));
    const timezone =
      this.getValue(calendarProps, 'X-WR-TIMEZONE') ??
      this.getValue(calendarProps, 'TZID');

    return {
      calendarName: this.getValue(calendarProps, 'X-WR-CALNAME'),
      refreshTtl: this.getValue(calendarProps, 'X-PUBLISHED-TTL'),
      timezone,
      games: this.eventBlocks(unfolded)
        .map((eventLines) => this.parseEvent(eventLines, timezone))
        .filter((event): event is ImportedCalendarGame => event !== null),
    };
  }

  private parseEvent(
    eventLines: string[],
    defaultTimezone?: string,
  ): ImportedCalendarGame | null {
    const props = this.parseProperties(eventLines);
    const uid = this.getValue(props, 'UID');
    const summary = this.getValue(props, 'SUMMARY');

    if (!uid || !summary || !this.isGameEvent(uid, summary)) {
      return null;
    }

    const startsAtProp = this.getProperty(props, 'DTSTART');
    if (!startsAtProp) {
      return null;
    }

    const description = this.getValue(props, 'DESCRIPTION');
    const teamNames = description
      ? this.extractTeamNames(description, summary)
      : {};
    const status = (this.getValue(props, 'STATUS') ??
      'CONFIRMED') as ImportedCalendarGameStatus;

    return {
      uid,
      sequence: this.parseNumber(this.getValue(props, 'SEQUENCE')),
      created: this.parseDateProperty(this.getProperty(props, 'CREATED')),
      lastModified: this.parseDateProperty(
        this.getProperty(props, 'LAST-MODIFIED'),
      ),
      startsAt: this.parseDateProperty(startsAtProp, defaultTimezone) as Date,
      endsAt: this.parseDateProperty(
        this.getProperty(props, 'DTEND'),
        defaultTimezone,
      ),
      summary,
      description,
      location: this.getValue(props, 'LOCATION'),
      status,
      ...teamNames,
      arrivalTime: description
        ? this.extractArrivalTime(description)
        : undefined,
      uniform: description ? this.extractUniform(description) : undefined,
    };
  }

  private unfoldLines(ics: string): string[] {
    return ics
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .reduce<string[]>((lines, line) => {
        if (
          (line.startsWith(' ') || line.startsWith('\t')) &&
          lines.length > 0
        ) {
          lines[lines.length - 1] += line.slice(1);
        } else if (line.trim().length > 0) {
          lines.push(line);
        }
        return lines;
      }, []);
  }

  private eventBlocks(lines: string[]): string[][] {
    const blocks: string[][] = [];
    let current: string[] | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        current = [];
        continue;
      }
      if (line === 'END:VEVENT') {
        if (current) {
          blocks.push(current);
        }
        current = null;
        continue;
      }
      if (current) {
        current.push(line);
      }
    }

    return blocks;
  }

  private calendarLines(lines: string[]): string[] {
    const calendarLines: string[] = [];
    let inEvent = false;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        inEvent = true;
        continue;
      }
      if (line === 'END:VEVENT') {
        inEvent = false;
        continue;
      }
      if (!inEvent && !line.startsWith('BEGIN:') && !line.startsWith('END:')) {
        calendarLines.push(line);
      }
    }

    return calendarLines;
  }

  private parseProperties(lines: string[]): IcsProperty[] {
    return lines.map((line) => {
      const separatorIndex = line.indexOf(':');
      const nameAndParams =
        separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
      const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1) : '';
      const [rawName, ...rawParams] = nameAndParams.split(';');
      const params = rawParams.reduce<Record<string, string>>((acc, param) => {
        const [key, paramValue] = param.split('=');
        if (key && paramValue) {
          acc[key.toUpperCase()] = paramValue;
        }
        return acc;
      }, {});

      return {
        name: rawName.toUpperCase(),
        params,
        value: this.unescapeValue(value),
      };
    });
  }

  private getProperty(
    props: IcsProperty[],
    name: string,
  ): IcsProperty | undefined {
    return props.find((prop) => prop.name === name.toUpperCase());
  }

  private getValue(props: IcsProperty[], name: string): string | undefined {
    return this.getProperty(props, name)?.value;
  }

  private unescapeValue(value: string): string {
    return value
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\')
      .trim();
  }

  private isGameEvent(uid: string, summary: string): boolean {
    return uid.startsWith('Game_') || /\b-\s*Game\b/i.test(summary);
  }

  private parseDateProperty(
    property?: IcsProperty,
    defaultTimezone?: string,
  ): Date | undefined {
    if (!property?.value) {
      return undefined;
    }

    const value = property.value;
    if (/^\d{8}T\d{6}Z$/.test(value)) {
      return new Date(
        `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}.000Z`,
      );
    }

    if (/^\d{8}T\d{6}$/.test(value)) {
      return this.zonedLocalDateTimeToUtc(
        value,
        property.params.TZID ?? defaultTimezone,
      );
    }

    if (/^\d{8}$/.test(value)) {
      return this.zonedLocalDateTimeToUtc(
        `${value}T000000`,
        property.params.TZID ?? defaultTimezone,
      );
    }

    return new Date(value);
  }

  private zonedLocalDateTimeToUtc(value: string, timezone = 'UTC'): Date {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const hour = Number(value.slice(9, 11));
    const minute = Number(value.slice(11, 13));
    const second = Number(value.slice(13, 15));
    const utcGuess = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    );
    const offsetMinutes = this.getTimezoneOffsetMinutes(utcGuess, timezone);

    return new Date(utcGuess.getTime() - offsetMinutes * 60_000);
  }

  private getTimezoneOffsetMinutes(date: Date, timezone: string): number {
    if (timezone === 'UTC') {
      return 0;
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    const zonedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    return (zonedAsUtc - date.getTime()) / 60_000;
  }

  private extractTeamNames(
    description: string,
    summary: string,
  ): Partial<ImportedCalendarGame> {
    const firstLine = description.split('\n')[0]?.trim();
    if (!firstLine) {
      return {};
    }

    const matchup = firstLine.match(/^(.+?)\s+at\s+(.+?)(?:\s+\(|$)/i);
    if (!matchup) {
      return {};
    }

    const awayTeamName = matchup[1].trim();
    const homeTeamName = matchup[2].trim();
    const managedTeamName =
      this.extractManagedTeamName(summary, awayTeamName, homeTeamName) ??
      awayTeamName;
    const opponentName =
      managedTeamName === awayTeamName ? homeTeamName : awayTeamName;

    return {
      managedTeamName,
      opponentName,
      homeTeamName,
      awayTeamName,
    };
  }

  private extractManagedTeamName(
    summary: string,
    awayTeamName: string,
    homeTeamName: string,
  ): string | undefined {
    const summaryPrefix = summary.split(' - ')[0]?.trim();
    if (summaryPrefix === awayTeamName || summaryPrefix === homeTeamName) {
      return summaryPrefix;
    }

    return undefined;
  }

  private extractArrivalTime(description: string): string | undefined {
    return description.match(/Arrive by\s+([^\n]+)/i)?.[1]?.trim();
  }

  private extractUniform(description: string): string | undefined {
    return description.match(/Uniform:\s+([^\n]+)/i)?.[1]?.trim();
  }

  private parseNumber(value?: string): number | undefined {
    return value ? Number(value) : undefined;
  }
}
