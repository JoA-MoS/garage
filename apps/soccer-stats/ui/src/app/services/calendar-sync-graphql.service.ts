import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';

export interface CalendarSourceViewModel {
  id: string;
  teamId: string;
  provider: 'PLAYMETRICS' | 'playmetrics' | string;
  feedUrl: string;
  calendarName?: string | null;
  enabled: boolean;
  lastSyncedAt?: string | null;
  lastSyncStatus:
    | 'NEVER_SYNCED'
    | 'SUCCESS'
    | 'ERROR'
    | 'never_synced'
    | 'success'
    | 'error'
    | string;
  lastSyncError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamCalendarSourcesResponse {
  teamCalendarSources: CalendarSourceViewModel[];
}

export interface CreateTeamCalendarSourceResponse {
  createTeamCalendarSource: CalendarSourceViewModel;
}

export interface SyncTeamCalendarSourceResponse {
  syncTeamCalendarSource: {
    sourceId: string;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
}

interface TeamCalendarSourcesVariables {
  teamId: string;
}

interface CreateTeamCalendarSourceVariables {
  input: {
    teamId: string;
    provider: 'PLAYMETRICS';
    feedUrl: string;
    enabled: boolean;
  };
}

interface SyncTeamCalendarSourceVariables {
  teamId: string;
  sourceId: string;
}

export const TEAM_CALENDAR_SOURCES = gql`
  query TeamCalendarSources($teamId: ID!) {
    teamCalendarSources(teamId: $teamId) {
      id
      teamId
      provider
      feedUrl
      calendarName
      enabled
      lastSyncedAt
      lastSyncStatus
      lastSyncError
      createdAt
      updatedAt
    }
  }
` as TypedDocumentNode<
  TeamCalendarSourcesResponse,
  TeamCalendarSourcesVariables
>;

export const CREATE_TEAM_CALENDAR_SOURCE = gql`
  mutation CreateTeamCalendarSource($input: CreateCalendarSourceInput!) {
    createTeamCalendarSource(input: $input) {
      id
      teamId
      provider
      feedUrl
      calendarName
      enabled
      lastSyncedAt
      lastSyncStatus
      lastSyncError
      createdAt
      updatedAt
    }
  }
` as TypedDocumentNode<
  CreateTeamCalendarSourceResponse,
  CreateTeamCalendarSourceVariables
>;

export const SYNC_TEAM_CALENDAR_SOURCE = gql`
  mutation SyncTeamCalendarSource($teamId: ID!, $sourceId: ID!) {
    syncTeamCalendarSource(teamId: $teamId, sourceId: $sourceId) {
      sourceId
      created
      updated
      skipped
      errors
    }
  }
` as TypedDocumentNode<
  SyncTeamCalendarSourceResponse,
  SyncTeamCalendarSourceVariables
>;
