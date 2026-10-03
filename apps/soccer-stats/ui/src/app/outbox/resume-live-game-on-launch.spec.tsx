import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import {
  ResumeLiveGameOnLaunch,
  resetLaunchResumeForTests,
} from './resume-live-game-on-launch';

const auth = { isLoaded: true, userId: 'u1' as string | null };
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => auth }));

const findGameToResume = vi.fn();
vi.mock('./live-game-resume', () => ({
  findGameToResume: (...args: unknown[]) => findGameToResume(...args),
}));
vi.mock('./outbox-registry', () => ({
  hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ResumeLiveGameOnLaunch />
      <Routes>
        <Route path="/" element={<p>Dashboard</p>} />
        <Route path="/games/:gameId" element={<p>Game page</p>} />
        <Route path="/teams" element={<p>Teams</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResumeLiveGameOnLaunch', () => {
  beforeEach(() => {
    resetLaunchResumeForTests();
    vi.clearAllMocks();
    auth.isLoaded = true;
    auth.userId = 'u1';
  });

  it('opens the game to resume when the app launches on the dashboard', async () => {
    findGameToResume.mockResolvedValue('g1');

    renderAt('/');
    await act(async () => undefined);

    expect(screen.getByText('Game page')).toBeTruthy();
    expect(findGameToResume).toHaveBeenCalledWith('u1', expect.any(Function));
  });

  it('stays on the dashboard when there is nothing to resume', async () => {
    findGameToResume.mockResolvedValue(undefined);

    renderAt('/');
    await act(async () => undefined);

    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('respects a launch onto another page (e.g. a shared link)', async () => {
    findGameToResume.mockResolvedValue('g1');

    renderAt('/teams');
    await act(async () => undefined);

    expect(screen.getByText('Teams')).toBeTruthy();
    expect(findGameToResume).not.toHaveBeenCalled();
  });

  it('only acts once per launch, so tapping Dashboard later stays there', async () => {
    findGameToResume.mockResolvedValue('g1');
    const first = renderAt('/');
    await act(async () => undefined);
    first.unmount();

    renderAt('/');
    await act(async () => undefined);

    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(findGameToResume).toHaveBeenCalledTimes(1);
  });

  it('waits for sign-in to load, and does nothing when signed out', async () => {
    auth.isLoaded = false;
    const { rerender } = renderAt('/');
    await act(async () => undefined);
    expect(findGameToResume).not.toHaveBeenCalled();

    auth.isLoaded = true;
    auth.userId = null;
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <ResumeLiveGameOnLaunch />
      </MemoryRouter>,
    );
    await act(async () => undefined);
    expect(findGameToResume).not.toHaveBeenCalled();
  });
});
