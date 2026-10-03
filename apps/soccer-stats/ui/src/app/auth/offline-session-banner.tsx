import { useEffect, useState } from 'react';

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/**
 * Shown while running on the offline session (see session.tsx).
 *
 * Clerk doesn't retry a failed load, so getting back to a real session
 * takes a reload. That happens on its own when the coach comes back to the
 * app with signal - a moment nothing is in progress - or when they tap
 * Reconnect. Queued changes and the saved cache survive a reload.
 */
export function OfflineSessionBanner() {
  const online = useOnline();

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        window.location.reload();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <span>Offline — showing saved data; changes will sync.</span>
      {online && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] shrink-0 rounded-md bg-amber-600 px-3 font-semibold text-white hover:bg-amber-700"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}
