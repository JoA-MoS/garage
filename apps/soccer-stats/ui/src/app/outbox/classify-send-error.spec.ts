import { describe, expect, it } from 'vitest';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';

import { classifySendError } from './classify-send-error';

function graphqlError(extensions: Record<string, unknown>, message = 'boom') {
  return new CombinedGraphQLErrors({
    data: null,
    errors: [{ message, extensions }],
  });
}

describe('classifySendError', () => {
  it('treats a 409 (already applied, events since deleted) as done', () => {
    expect(
      classifySendError(
        graphqlError({ code: 'INTERNAL_SERVER_ERROR', status: 409 }),
      ),
    ).toEqual({ kind: 'done' });
  });

  it.each([
    ['BAD_REQUEST', undefined],
    ['BAD_USER_INPUT', undefined],
    ['FORBIDDEN', undefined],
    ['INTERNAL_SERVER_ERROR', 404],
    ['GRAPHQL_VALIDATION_FAILED', undefined],
  ])('fails (needs the user) on %s %s', (code, status) => {
    expect(
      classifySendError(graphqlError({ code, status }, 'Player not found')),
    ).toEqual({ kind: 'fail', message: 'Player not found' });
  });

  it('retries when the session expired (the token refreshes)', () => {
    expect(
      classifySendError(graphqlError({ code: 'UNAUTHENTICATED' })),
    ).toEqual({ kind: 'retry', message: 'boom' });
  });

  it('retries an unexpected server error (e.g. the database resuming)', () => {
    expect(
      classifySendError(graphqlError({ code: 'INTERNAL_SERVER_ERROR' })),
    ).toEqual({ kind: 'retry', message: 'boom' });
  });

  it('retries HTTP-level and network failures', () => {
    const serverError = new ServerError('Bad Gateway', {
      response: new Response('', { status: 502 }),
      bodyText: '',
    });
    expect(classifySendError(serverError).kind).toBe('retry');
    expect(classifySendError(new TypeError('Failed to fetch')).kind).toBe(
      'retry',
    );
  });
});
