import { API_PREFIX, getApiUrl } from './environment';

// Aurora Serverless v2 auto-pauses when idle and takes ~15s to resume. Pinging
// the warmup endpoint early lets the resume overlap app startup.
const WARMUP_THROTTLE_MS = 60_000;

let lastWarmupStartedAt: number | null = null;

export function resetWarmupThrottleForTests(): void {
  lastWarmupStartedAt = null;
}

/**
 * Fire-and-forget request to wake the API database. Never throws and is
 * throttled to one request per minute. No abort timeout is set because a cold
 * resume can take well over 15s.
 */
export function warmUpApi(): void {
  const now = Date.now();
  if (
    lastWarmupStartedAt !== null &&
    now - lastWarmupStartedAt < WARMUP_THROTTLE_MS
  ) {
    return;
  }
  lastWarmupStartedAt = now;

  try {
    fetch(`${getApiUrl()}/${API_PREFIX}/warmup`).catch((error) => {
      console.debug('API warm-up failed', error);
    });
  } catch (error) {
    console.debug('API warm-up failed', error);
  }
}

/**
 * Re-warms the API when the app returns to the foreground or the network
 * comes back. Returns a cleanup function that removes the listeners.
 */
export function registerWarmupOnWake(): () => void {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      warmUpApi();
    }
  };
  const onOnline = () => warmUpApi();

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('online', onOnline);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', onOnline);
  };
}
