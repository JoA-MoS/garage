import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useSession } from '../auth/session';

import { findGameToResume } from './live-game-resume';
import { hasUnsyncedChanges } from './outbox-registry';

// Once per app launch (module scope): later visits to the dashboard - the
// coach tapping Dashboard - must stay there.
let launchHandled = false;

export function resetLaunchResumeForTests(): void {
  launchHandled = false;
}

/**
 * When the app launches on the dashboard, reopens the game the coach was
 * recording (see findGameToResume). An installed web app always relaunches
 * at its start URL, so without this a coach who closed the app mid-game
 * lands on the dashboard. A launch onto any other page (a shared link) is
 * left alone.
 */
export function ResumeLiveGameOnLaunch() {
  const { isLoaded, userId } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const launchPath = useRef(location.pathname);

  useEffect(() => {
    if (launchHandled || !isLoaded) return;
    launchHandled = true;
    if (!userId || launchPath.current !== '/') return;

    void findGameToResume(userId, (gameId) =>
      hasUnsyncedChanges(userId, gameId),
    ).then((gameId) => {
      // Don't pull the coach away if they already moved on.
      if (gameId && window.location.pathname === launchPath.current) {
        navigate(`/games/${gameId}`, { replace: true });
      }
    });
  }, [isLoaded, userId, navigate]);

  return null;
}
