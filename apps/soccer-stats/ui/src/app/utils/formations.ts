/**
 * Get available formations for a given team size
 */
export function getFormationsForTeamSize(playersPerTeam: number): string[] {
  const formations: Record<number, string[]> = {
    3: ['1-1-1', '2-1', '1-2'],
    4: ['1-2-1', '2-1-1', '1-1-2', '2-2'],
    5: ['1-2-2', '2-1-2', '2-2-1', '1-3-1', '3-1-1'],
    6: ['2-2-2', '2-3-1', '3-2-1', '1-3-2'],
    7: ['2-3-2', '3-2-2', '2-2-3', '3-3-1'],
    9: ['3-3-3', '3-2-4', '4-3-2', '3-4-2'],
    11: ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '3-4-3'],
  };
  return formations[playersPerTeam] || [];
}
