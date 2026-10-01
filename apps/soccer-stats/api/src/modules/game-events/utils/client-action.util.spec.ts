import { BadRequestException } from '@nestjs/common';

import {
  assertClientUuid,
  MAX_CLIENT_CLOCK_SKEW_MS,
  resolveOccurredAt,
} from './client-action.util';

describe('assertClientUuid', () => {
  it('accepts undefined and null (field not supplied)', () => {
    expect(() => assertClientUuid(undefined, 'actionId')).not.toThrow();
    expect(() => assertClientUuid(null, 'actionId')).not.toThrow();
  });

  it('accepts a v4 UUID', () => {
    expect(() =>
      assertClientUuid('3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b', 'actionId'),
    ).not.toThrow();
  });

  it('rejects anything that is not a UUID, naming the field', () => {
    expect(() => assertClientUuid('evt-1', 'subInEventId')).toThrow(
      new BadRequestException('subInEventId must be a UUID'),
    );
  });
});

describe('resolveOccurredAt', () => {
  const now = new Date('2026-10-01T18:00:00.000Z');

  it('returns undefined when the client did not supply a time', () => {
    expect(resolveOccurredAt(undefined, now)).toBeUndefined();
    expect(resolveOccurredAt(null, now)).toBeUndefined();
  });

  it('keeps a past client time as-is (a queued action synced late)', () => {
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60_000);
    expect(resolveOccurredAt(tenMinutesAgo, now)).toEqual(tenMinutesAgo);
  });

  it('keeps a slightly-future time within allowed clock skew', () => {
    const skewed = new Date(now.getTime() + MAX_CLIENT_CLOCK_SKEW_MS);
    expect(resolveOccurredAt(skewed, now)).toEqual(skewed);
  });

  it('clamps a time further in the future than the skew allowance to now', () => {
    const farFuture = new Date(now.getTime() + MAX_CLIENT_CLOCK_SKEW_MS + 1);
    expect(resolveOccurredAt(farFuture, now)).toEqual(now);
  });

  it('accepts ISO strings (GraphQL DateTime may arrive unparsed)', () => {
    expect(resolveOccurredAt('2026-10-01T17:59:00.000Z', now)).toEqual(
      new Date('2026-10-01T17:59:00.000Z'),
    );
  });

  it('rejects an unparseable time', () => {
    expect(() => resolveOccurredAt('not-a-date', now)).toThrow(
      new BadRequestException('occurredAt must be a valid date-time'),
    );
  });
});
