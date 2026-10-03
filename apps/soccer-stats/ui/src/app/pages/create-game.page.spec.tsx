import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateGamePage } from './create-game.page';

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock('@apollo/client/react', () => ({
  useQuery: useQueryMock,
  useMutation: () => [vi.fn(), { loading: false }],
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <CreateGamePage />
    </MemoryRouter>,
  );

describe('CreateGamePage loading state', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
  });

  it('shows the spinner when there is no data yet', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });
    renderPage();
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders cached data without a spinner while a background refetch is loading', () => {
    // cache-and-network: Apollo reports loading=true alongside cached data.
    useQueryMock.mockImplementation(
      (doc: { definitions: Array<{ name?: { value: string } }> }) => {
        const name = doc.definitions[0]?.name?.value;
        return {
          data:
            name === 'GetGameFormats'
              ? { gameFormats: [] }
              : { managedTeams: [] },
          loading: true,
          error: undefined,
        };
      },
    );
    renderPage();
    expect(screen.queryByText('Loading...')).toBeNull();
    expect(screen.getByText('No Teams Found')).toBeTruthy();
  });
});
