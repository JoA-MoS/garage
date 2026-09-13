import { useState, useCallback, useMemo } from 'react';

import {
  ALL_FORMATIONS,
  POSITIONS,
  type Formation,
  type FormationPosition,
} from '@garage/soccer-stats/utils';

import { UIGameFormat, UIFormation, UIPosition } from '../types/ui.types';

// Game formats with mobile-first design consideration
const GAME_FORMATS: UIGameFormat[] = [
  {
    id: '11v11',
    name: '11v11',
    playersPerTeam: 11,
    durationMinutes: 90,
    allowsSubstitutions: true,
    maxSubstitutions: 5,
    description: 'Traditional full-field soccer with 11 players per side',
    // Legacy support
    displayName: 'Full Field',
    playersPerSide: 11,
    defaultDuration: 90,
  },
  {
    id: '9v9',
    name: '9v9',
    playersPerTeam: 9,
    durationMinutes: 80,
    allowsSubstitutions: true,
    maxSubstitutions: 5,
    description: 'Youth leagues and recreational play with 9 players per side',
    // Legacy support
    displayName: 'Medium Field',
    playersPerSide: 9,
    defaultDuration: 80,
  },
  {
    id: '7v7',
    name: '7v7',
    playersPerTeam: 7,
    durationMinutes: 60,
    allowsSubstitutions: true,
    maxSubstitutions: 3,
    description: 'Youth development with 7 players per side',
    // Legacy support
    displayName: 'Small Field',
    playersPerSide: 7,
    defaultDuration: 60,
  },
  {
    id: '5v5',
    name: '5v5',
    playersPerTeam: 5,
    durationMinutes: 40,
    allowsSubstitutions: true,
    maxSubstitutions: 3,
    description: 'Indoor futsal or small-sided games',
    // Legacy support
    displayName: 'Futsal',
    playersPerSide: 5,
    defaultDuration: 40,
  },
];

/**
 * Converts one formation's position list from the shared catalog's vertical
 * field (x: sideline 0-100, y: own-goal-to-opponent-goal 0-100) into this
 * editor's horizontal field, by swapping axes and mirroring left/right
 * (x = old y, y = 100 - old x). Duplicate position codes (e.g. two CBs) get
 * a numeric suffix so each position has a stable, unique id.
 */
function toUIPositions(positions: FormationPosition[]): UIPosition[] {
  const totalByCode = new Map<string, number>();
  for (const { position } of positions) {
    totalByCode.set(position, (totalByCode.get(position) ?? 0) + 1);
  }

  const seenByCode = new Map<string, number>();
  return positions.map(({ position, x, y }) => {
    const info = POSITIONS[position];
    const occurrence = (seenByCode.get(position) ?? 0) + 1;
    seenByCode.set(position, occurrence);
    const suffix = (totalByCode.get(position) ?? 1) > 1 ? occurrence : '';

    return {
      id: `${position.toLowerCase()}${suffix}`,
      name: info.name,
      abbreviation: info.code,
      x: y,
      y: 100 - x,
    };
  });
}

// Formations for the team configuration editor, derived from the shared
// @garage/soccer-stats/utils catalog so both flows stay in sync. `id` is the
// bare formation code (e.g. "4-4-2") to match how `defaultFormation` is
// stored and compared elsewhere (team-configuration.entity, games.service).
function toUIFormations(formations: Formation[]): UIFormation[] {
  return formations.flatMap((formation) => {
    const gameFormat = GAME_FORMATS.find(
      (gf) => gf.playersPerTeam === formation.playersPerTeam,
    );
    // Sizes with no corresponding UI game format (3v3, 4v4) aren't offered here.
    if (!gameFormat) return [];

    return [
      {
        id: formation.code,
        name: formation.name,
        gameFormat: gameFormat.id,
        playersPerSide: formation.playersPerTeam,
        isActive: true,
        positions: toUIPositions(formation.positions),
      },
    ];
  });
}

const FORMATIONS: UIFormation[] = toUIFormations(ALL_FORMATIONS);

export const useTeamConfigurationManager = () => {
  const [selectedGameFormat, setSelectedGameFormat] = useState<string>('');
  const [selectedFormation, setSelectedFormation] = useState<string>('');
  const [positions, setPositions] = useState<UIPosition[]>([]);

  const availableFormations = useMemo(() => {
    if (!selectedGameFormat) return [];
    return FORMATIONS.filter((f) => f.gameFormat === selectedGameFormat);
  }, [selectedGameFormat]);

  const selectGameFormat = useCallback((formatId: string) => {
    setSelectedGameFormat(formatId);
    setSelectedFormation(''); // Reset formation when game format changes
    setPositions([]);
  }, []);

  const selectFormation = useCallback((formationId: string) => {
    const formation = FORMATIONS.find((f) => f.id === formationId);
    if (formation) {
      setSelectedFormation(formationId);
      setPositions([...formation.positions]); // Copy positions so they can be modified
    }
  }, []);

  const updatePosition = useCallback(
    (positionId: string, updates: Partial<UIPosition>) => {
      setPositions((prev) =>
        prev.map((pos) =>
          pos.id === positionId ? { ...pos, ...updates } : pos,
        ),
      );
    },
    [],
  );

  const addPosition = useCallback((position: UIPosition) => {
    setPositions((prev) => [...prev, position]);
  }, []);

  const removePosition = useCallback((positionId: string) => {
    setPositions((prev) => prev.filter((pos) => pos.id !== positionId));
  }, []);

  const resetConfiguration = useCallback(() => {
    setSelectedGameFormat('');
    setSelectedFormation('');
    setPositions([]);
  }, []);

  return {
    // Data
    gameFormats: GAME_FORMATS,
    formations: FORMATIONS,
    availableFormations,
    selectedGameFormat,
    selectedFormation,
    positions,

    // Actions
    selectGameFormat,
    selectFormation,
    updatePosition,
    addPosition,
    removePosition,
    resetConfiguration,
  };
};

// Default export for compatibility
export default useTeamConfigurationManager;
