import { BadRequestException } from '@nestjs/common';

/**
 * How far ahead of the server a client's clock may be before its
 * `occurredAt` is treated as wrong and replaced with the server time.
 */
export const MAX_CLIENT_CLOCK_SKEW_MS = 2 * 60_000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Client-chosen IDs (action IDs, event row IDs) go straight into uuid
 * columns. ValidationPipe isn't used for this GraphQL API, so check here to
 * return a clear error instead of a Postgres cast failure.
 */
export function assertClientUuid(
  value: string | null | undefined,
  fieldName: string,
): void {
  if (value == null) return;
  if (!UUID_PATTERN.test(value)) {
    throw new BadRequestException(`${fieldName} must be a UUID`);
  }
}

/**
 * The wall-clock time the user performed an action, as stamped by the
 * client. Actions can sync long after they happened (the outbox replays
 * them), so this, not the server's receipt time, is what the game clock
 * should use. Past times are trusted; times implausibly far in the future
 * are clamped to `now`.
 */
export function resolveOccurredAt(
  value: Date | string | null | undefined,
  now: Date = new Date(),
): Date | undefined {
  if (value == null) return undefined;
  const occurredAt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new BadRequestException('occurredAt must be a valid date-time');
  }
  if (occurredAt.getTime() - now.getTime() > MAX_CLIENT_CLOCK_SKEW_MS) {
    return now;
  }
  return occurredAt;
}
