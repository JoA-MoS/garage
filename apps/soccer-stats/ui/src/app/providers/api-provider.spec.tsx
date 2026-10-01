import { render, act } from '@testing-library/react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { it, expect, vi } from 'vitest';

import { ApiProvider } from './api-provider';

const auth = vi.hoisted(() => ({
  userId: 'A',
  sessionId: 'one',
  isLoaded: true,
  getToken: vi.fn(async () => 'token-A'),
}));
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }));
it('isolates cached private data and old client writes across account/session changes', async () => {
  const clients: ReturnType<typeof useApolloClient>[] = [];
  function Child() {
    clients.push(useApolloClient());
    return null;
  }
  const h = render(
    <ApiProvider>
      <Child />
    </ApiProvider>,
  );
  const a = clients.at(-1)!;
  const query = gql`
    query Private {
      secret
    }
  `;
  a.writeQuery({ query, data: { secret: 'A' } });
  auth.userId = 'B';
  auth.sessionId = 'two';
  h.rerender(
    <ApiProvider>
      <Child />
    </ApiProvider>,
  );
  const b = clients.at(-1)!;
  expect(b).not.toBe(a);
  expect(b.readQuery({ query })).toBeNull();
  await act(async () => {
    a.writeQuery({ query, data: { secret: 'late-A' } });
  });
  expect(b.readQuery({ query })).toBeNull();
  h.unmount();
});
