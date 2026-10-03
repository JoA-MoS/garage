import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  CLERK_LOAD_TIMEOUT_MS,
  OFFLINE_SESSION_MAX_AGE_MS,
  SessionProvider,
  readRecentSignedInUser,
  rememberSignedInUser,
  resolveSession,
  useSession,
} from './session';

const NOW = Date.parse('2026-10-03T10:00:00.000Z');

describe('resolveSession', () => {
  it("uses Clerk's answer once Clerk has loaded", () => {
    expect(
      resolveSession({
        clerkLoaded: true,
        clerkUserId: 'u1',
        offlineUserId: 'old',
        gaveUpOnClerk: true,
      }),
    ).toEqual({
      isLoaded: true,
      userId: 'u1',
      isSignedIn: true,
      isOffline: false,
    });

    expect(
      resolveSession({
        clerkLoaded: true,
        clerkUserId: null,
        offlineUserId: 'old',
        gaveUpOnClerk: true,
      }),
    ).toEqual({
      isLoaded: true,
      userId: null,
      isSignedIn: false,
      isOffline: false,
    });
  });

  it('waits for Clerk until it gives up', () => {
    expect(
      resolveSession({
        clerkLoaded: false,
        clerkUserId: null,
        offlineUserId: 'u1',
        gaveUpOnClerk: false,
      }),
    ).toEqual({
      isLoaded: false,
      userId: null,
      isSignedIn: false,
      isOffline: false,
    });
  });

  it('falls back to the offline session for the last user on this device', () => {
    expect(
      resolveSession({
        clerkLoaded: false,
        clerkUserId: null,
        offlineUserId: 'u1',
        gaveUpOnClerk: true,
      }),
    ).toEqual({
      isLoaded: true,
      userId: 'u1',
      isSignedIn: true,
      isOffline: true,
    });
  });

  it('is signed out (but offline) when there is no recent user to fall back to', () => {
    expect(
      resolveSession({
        clerkLoaded: false,
        clerkUserId: null,
        offlineUserId: null,
        gaveUpOnClerk: true,
      }),
    ).toEqual({
      isLoaded: true,
      userId: null,
      isSignedIn: false,
      isOffline: true,
    });
  });
});

describe('remembered user', () => {
  beforeEach(() => localStorage.clear());

  it(`is only trusted for ${OFFLINE_SESSION_MAX_AGE_MS / 86_400_000} days`, () => {
    rememberSignedInUser('u1', NOW - OFFLINE_SESSION_MAX_AGE_MS);
    expect(readRecentSignedInUser(NOW)).toBe('u1');

    rememberSignedInUser('u1', NOW - OFFLINE_SESSION_MAX_AGE_MS - 1);
    expect(readRecentSignedInUser(NOW)).toBeNull();
  });

  it('ignores unreadable storage', () => {
    localStorage.setItem('soccer-stats:last-signed-in-user', 'not json');
    expect(readRecentSignedInUser(NOW)).toBeNull();
  });
});

const clerk = { isLoaded: false, userId: null as string | null };
vi.mock('@clerk/clerk-react', () => ({ useAuth: () => clerk }));

describe('SessionProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );
  let online = true;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    clerk.isLoaded = false;
    clerk.userId = null;
    online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens straight into the offline session when the phone is offline', () => {
    rememberSignedInUser('u1');
    online = false;

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current).toMatchObject({ userId: 'u1', isOffline: true });
  });

  it('falls back after Clerk fails to load in time (signal but no data)', () => {
    rememberSignedInUser('u1');
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.isLoaded).toBe(false);

    act(() => {
      vi.advanceTimersByTime(CLERK_LOAD_TIMEOUT_MS);
    });

    expect(result.current).toMatchObject({ userId: 'u1', isOffline: true });
  });

  it('switches to Clerk once it loads, remembering the signed-in user', () => {
    online = false;
    const { result, rerender } = renderHook(() => useSession(), { wrapper });

    clerk.isLoaded = true;
    clerk.userId = 'u2';
    rerender();

    expect(result.current).toMatchObject({ userId: 'u2', isOffline: false });
    expect(readRecentSignedInUser()).toBe('u2');
  });

  it('forgets the remembered user when Clerk says nobody is signed in', () => {
    rememberSignedInUser('u1');
    clerk.isLoaded = true;
    clerk.userId = null;

    renderHook(() => useSession(), { wrapper });

    expect(readRecentSignedInUser()).toBeNull();
  });
});
