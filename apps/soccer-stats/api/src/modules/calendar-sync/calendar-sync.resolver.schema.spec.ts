import {
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { printSchema } from 'graphql';

import { TeamMembersService } from '../team-members/team-members.service';
import { UsersService } from '../users/users.service';
import { ClerkService } from '../auth/clerk.service';

import { CalendarSyncService } from './calendar-sync.service';
import { CalendarSyncResolver } from './calendar-sync.resolver';

describe('CalendarSyncResolver schema', () => {
  it('registers the calendar import query and mutations in the GraphQL schema', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
      providers: [
        CalendarSyncResolver,
        {
          provide: CalendarSyncService,
          useValue: {
            findSourcesForTeam: jest.fn(),
            createSource: jest.fn(),
            syncSource: jest.fn(),
          },
        },
        { provide: ClerkService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: TeamMembersService, useValue: {} },
      ],
    }).compile();

    const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
    const schema = await schemaFactory.create([CalendarSyncResolver]);
    const sdl = printSchema(schema);

    expect(sdl).toContain('input CreateCalendarSourceInput');
    expect(sdl).toContain(
      'teamCalendarSources(teamId: ID!): [CalendarSource!]!',
    );
    expect(sdl).toContain(
      'createTeamCalendarSource(input: CreateCalendarSourceInput!): CalendarSource!',
    );
    expect(sdl).toContain(
      'syncTeamCalendarSource(teamId: ID!, sourceId: ID!): CalendarSyncResultType!',
    );
  });
});
