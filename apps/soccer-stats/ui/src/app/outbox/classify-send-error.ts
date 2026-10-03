import { CombinedGraphQLErrors } from '@apollo/client/errors';

import type { SendFailure } from './outbox-types';

/** Error codes meaning the server rejected the action as given. */
const REJECTED_CODES = new Set([
  'BAD_REQUEST',
  'BAD_USER_INPUT',
  'FORBIDDEN',
  'GRAPHQL_VALIDATION_FAILED',
  'GRAPHQL_PARSE_FAILED',
]);

/**
 * Decides what the outbox does after a failed send.
 *
 * NestJS's Apollo driver maps only 400/422/401/403 to error codes. Other
 * HTTP exceptions arrive as INTERNAL_SERVER_ERROR with the real status in
 * `extensions.status` (404 not found, 409 already applied), and unexpected
 * errors arrive with no status at all.
 */
export function classifySendError(error: unknown): SendFailure {
  if (!CombinedGraphQLErrors.is(error)) {
    // Network failure, HTTP 5xx (e.g. a deploy), aborted request.
    return { kind: 'retry', message: messageOf(error) };
  }

  const first = error.errors[0];
  const code = first?.extensions?.['code'];
  const status = first?.extensions?.['status'];
  const message = first?.message ?? error.message;

  if (status === 409) return { kind: 'done' };
  if (
    status === 404 ||
    (typeof code === 'string' && REJECTED_CODES.has(code))
  ) {
    return { kind: 'fail', message };
  }
  // UNAUTHENTICATED: the next attempt gets a fresh token.
  // INTERNAL_SERVER_ERROR without a status: likely transient. The outbox
  // gives up after a few attempts so a persistent bug can't block it.
  return { kind: 'retry', message };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
