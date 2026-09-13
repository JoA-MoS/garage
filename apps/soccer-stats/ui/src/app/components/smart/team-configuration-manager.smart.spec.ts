import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useTeamConfigurationManager } from './team-configuration-manager.smart';

describe('useTeamConfigurationManager formations', () => {
  it('derives formations from the shared @garage/soccer-stats/utils catalog', () => {
    const { result } = renderHook(() => useTeamConfigurationManager());
    const ids = result.current.formations.map((f) => f.id);

    // Formations added to the shared catalog show up here automatically.
    expect(ids).toContain('4-3-1');
    expect(ids).toContain('4-2-3-1');

    // Sizes with no matching UI game format (3v3, 4v4) are filtered out.
    const sizes = new Set(
      result.current.formations.map((f) => f.playersPerSide),
    );
    expect(sizes.has(3)).toBe(false);
    expect(sizes.has(4)).toBe(false);
  });

  it('uses the bare formation code as id, matching stored defaultFormation values', () => {
    const { result } = renderHook(() => useTeamConfigurationManager());
    const fourFourTwo = result.current.formations.find(
      (f) => f.gameFormat === '11v11' && f.name === '4-4-2',
    );

    expect(fourFourTwo?.id).toBe('4-4-2');
  });

  it('transforms shared vertical-field coordinates into the horizontal-field editor layout', () => {
    const { result } = renderHook(() => useTeamConfigurationManager());
    const fourFourTwo = result.current.formations.find(
      (f) => f.gameFormat === '11v11' && f.name === '4-4-2',
    );
    const gk = fourFourTwo?.positions.find((p) => p.abbreviation === 'GK');

    // Shared catalog: { position: 'GK', x: 50, y: 5 } -> x becomes old y, y mirrors old x
    expect(gk).toMatchObject({ x: 5, y: 50 });
  });

  it('disambiguates duplicate position codes with numeric suffixes', () => {
    const { result } = renderHook(() => useTeamConfigurationManager());
    const fourFourTwo = result.current.formations.find(
      (f) => f.gameFormat === '11v11' && f.name === '4-4-2',
    );
    const ids = fourFourTwo?.positions.map((p) => p.id);

    expect(ids).toContain('cb1');
    expect(ids).toContain('cb2');
  });

  it('selectFormation resolves by bare code and populates positions', () => {
    const { result } = renderHook(() => useTeamConfigurationManager());

    act(() => result.current.selectGameFormat('9v9'));
    act(() => result.current.selectFormation('4-3-1'));

    expect(result.current.selectedFormation).toBe('4-3-1');
    expect(result.current.positions).toHaveLength(9);
    expect(
      result.current.positions.filter((p) => p.abbreviation === 'CB'),
    ).toHaveLength(2);
  });
});
