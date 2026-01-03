/**
 * Utility functions for the Game page
 */

/**
 * Format elapsed seconds to MM:SS display
 */
export function formatGameTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * Compute score from GOAL events for a team
 */
export function computeScore(
  gameEvents: Array<{ eventType?: { name?: string } | null }> | null | undefined
): number {
  if (!gameEvents) return 0;
  return gameEvents.filter((event) => event.eventType?.name === 'GOAL').length;
}
