import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@clerk/clerk-react';

/**
 * Who is signed in, for the app's own screens and the outbox.
 *
 * Normally that's Clerk's answer. Clerk loads from its own servers, though,
 * so with no signal it never answers - and the app used to show a blank
 * page. When Clerk can't load, the app falls back to an offline session
 * for the last user who signed in on this device (within
 * OFFLINE_SESSION_MAX_AGE_MS): their saved games show and new actions are
 * queued. Once Clerk loads it takes over again; if it reports a different
 * user or nobody, the saved data is wiped (CachePersistence) and the
 * remembered user forgotten.
 *
 * Clerk-only operations (tokens, sign-out, impersonation) still use Clerk.
 */

/** How long a sign-in on this device is trusted for offline use. */
export const OFFLINE_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** With signal, how long to wait for Clerk before going offline. */
export const CLERK_LOAD_TIMEOUT_MS = 4000;

const STORAGE_KEY = 'soccer-stats:last-signed-in-user';

export interface Session {
  /** False only while waiting for Clerk. */
  isLoaded: boolean;
  userId: string | null;
  isSignedIn: boolean;
  /** Running on the offline session (or offline with nobody to fall back to). */
  isOffline: boolean;
}

export function rememberSignedInUser(
  userId: string,
  now: number = Date.now(),
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, at: now }));
  } catch {
    // Storage unavailable: no offline session on this device.
  }
}

export function forgetSignedInUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to forget.
  }
}

export function readRecentSignedInUser(
  now: number = Date.now(),
): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { userId, at } = JSON.parse(raw) as {
      userId?: unknown;
      at?: unknown;
    };
    if (typeof userId !== 'string' || typeof at !== 'number') return null;
    return now - at <= OFFLINE_SESSION_MAX_AGE_MS ? userId : null;
  } catch {
    return null;
  }
}

export function resolveSession({
  clerkLoaded,
  clerkUserId,
  offlineUserId,
  gaveUpOnClerk,
}: {
  clerkLoaded: boolean;
  clerkUserId: string | null | undefined;
  offlineUserId: string | null;
  gaveUpOnClerk: boolean;
}): Session {
  if (clerkLoaded) {
    const userId = clerkUserId ?? null;
    return { isLoaded: true, userId, isSignedIn: !!userId, isOffline: false };
  }
  if (!gaveUpOnClerk) {
    return {
      isLoaded: false,
      userId: null,
      isSignedIn: false,
      isOffline: false,
    };
  }
  return {
    isLoaded: true,
    userId: offlineUserId,
    isSignedIn: !!offlineUserId,
    isOffline: true,
  };
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isLoaded: clerkLoaded, userId: clerkUserId } = useAuth();
  // Offline at launch: no point waiting for Clerk.
  const [gaveUpOnClerk, setGaveUpOnClerk] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );
  // Read once: the fallback is the user from before this launch.
  const [offlineUserId] = useState(() => readRecentSignedInUser());

  useEffect(() => {
    if (clerkLoaded || gaveUpOnClerk) return;
    const giveUp = () => setGaveUpOnClerk(true);
    const timer = setTimeout(giveUp, CLERK_LOAD_TIMEOUT_MS);
    window.addEventListener('offline', giveUp);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('offline', giveUp);
    };
  }, [clerkLoaded, gaveUpOnClerk]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (clerkUserId) rememberSignedInUser(clerkUserId);
    else forgetSignedInUser();
  }, [clerkLoaded, clerkUserId]);

  const session = useMemo(
    () =>
      resolveSession({
        clerkLoaded,
        clerkUserId,
        offlineUserId,
        gaveUpOnClerk,
      }),
    [clerkLoaded, clerkUserId, offlineUserId, gaveUpOnClerk],
  );

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/** The effective session. Must be inside SessionProvider. */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return session;
}

/** Session-aware stand-in for Clerk's <SignedIn> (which needs Clerk loaded). */
export function WhenSignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useSession();
  return isLoaded && isSignedIn ? children : null;
}

/** Session-aware stand-in for Clerk's <SignedOut>. */
export function WhenSignedOut({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useSession();
  return isLoaded && !isSignedIn ? children : null;
}
