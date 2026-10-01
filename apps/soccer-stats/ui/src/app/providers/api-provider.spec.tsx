import { StrictMode } from 'react';
import { render, act } from '@testing-library/react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { it, expect, vi, beforeEach } from 'vitest';

import { ApiProvider } from './api-provider';

const auth = vi.hoisted(() => ({
  userId: 'A',
  sessionId: 'one',
  isLoaded: true,
  getToken: vi.fn(async () => 'token-A'),
}));
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }));
const disposed = vi.hoisted(() => new Set<unknown>());
vi.mock('../services/apollo-client', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/apollo-client')>();
  return {
    ...actual,
    createSessionApolloClient: (
      ...args: Parameters<typeof actual.createSessionApolloClient>
    ) => {
      const session = actual.createSessionApolloClient(...args);
      return {
        client: session.client,
        dispose: () => {
          disposed.add(session.client);
          session.dispose();
        },
      };
    },
  };
});
const flushDisposals = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
beforeEach(() => {
  auth.userId = 'A';
  auth.sessionId = 'one';
  auth.isLoaded = true;
  disposed.clear();
});
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
  await flushDisposals();
  expect(disposed.has(a)).toBe(true);
  expect(disposed.has(b)).toBe(false);
  h.unmount();
  await flushDisposals();
  expect(disposed.has(b)).toBe(true);
});

it('keeps the live client usable through StrictMode effect re-runs', async () => {
  const clients: ReturnType<typeof useApolloClient>[] = [];
  function Child() {
    clients.push(useApolloClient());
    return null;
  }
  const h = render(
    <StrictMode>
      <ApiProvider>
        <Child />
      </ApiProvider>
    </StrictMode>,
  );
  await flushDisposals();
  expect(disposed.has(clients.at(-1))).toBe(false);
  h.unmount();
  await flushDisposals();
  expect(disposed.has(clients.at(-1))).toBe(true);
});

it('renders children while Clerk is still loading', () => {
  auth.isLoaded = false;
  auth.userId = null as unknown as string;
  auth.sessionId = null as unknown as string;
  const h = render(
    <ApiProvider>
      <p>shell</p>
    </ApiProvider>,
  );
  expect(h.getByText('shell')).toBeTruthy();
  h.unmount();
});
