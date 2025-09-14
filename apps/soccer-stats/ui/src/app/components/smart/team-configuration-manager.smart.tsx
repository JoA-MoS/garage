import { useState, useCallback, useMemo } from 'react';

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

// Sample formations for different game formats
const FORMATIONS: UIFormation[] = [
  // 11v11 formations
  {
    id: '4-4-2-11v11',
    name: '4-4-2',
    gameFormat: '11v11',
    playersPerSide: 11,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 25, y: 40 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 60 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 50, y: 20 },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 40,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 60,
      },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 50, y: 80 },
      { id: 'st1', name: 'Striker', abbreviation: 'ST', x: 75, y: 35 },
      { id: 'st2', name: 'Striker', abbreviation: 'ST', x: 75, y: 65 },
    ],
  },
  {
    id: '4-3-3-11v11',
    name: '4-3-3',
    gameFormat: '11v11',
    playersPerSide: 11,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 25, y: 20 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 25, y: 40 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 60 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 25, y: 80 },
      {
        id: 'cdm',
        name: 'Defensive Midfielder',
        abbreviation: 'CDM',
        x: 45,
        y: 50,
      },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 35,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 65,
      },
      { id: 'rw', name: 'Right Winger', abbreviation: 'RW', x: 75, y: 20 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 75, y: 50 },
      { id: 'lw', name: 'Left Winger', abbreviation: 'LW', x: 75, y: 80 },
    ],
  },
  {
    id: '3-5-2-11v11',
    name: '3-5-2',
    gameFormat: '11v11',
    playersPerSide: 11,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 25, y: 30 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 25, y: 50 },
      { id: 'cb3', name: 'Center Back', abbreviation: 'CB', x: 25, y: 70 },
      { id: 'rwb', name: 'Right Wing Back', abbreviation: 'RWB', x: 45, y: 15 },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 35,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 50,
      },
      {
        id: 'cm3',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 65,
      },
      { id: 'lwb', name: 'Left Wing Back', abbreviation: 'LWB', x: 45, y: 85 },
      { id: 'st1', name: 'Striker', abbreviation: 'ST', x: 70, y: 40 },
      { id: 'st2', name: 'Striker', abbreviation: 'ST', x: 70, y: 60 },
    ],
  },
  // 9v9 formations
  {
    id: '3-3-2-9v9',
    name: '3-3-2',
    gameFormat: '9v9',
    playersPerSide: 9,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 30, y: 25 },
      { id: 'cb', name: 'Center Back', abbreviation: 'CB', x: 30, y: 50 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 30, y: 75 },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 55, y: 30 },
      {
        id: 'cm',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 50,
      },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 55, y: 70 },
      { id: 'st1', name: 'Striker', abbreviation: 'ST', x: 75, y: 40 },
      { id: 'st2', name: 'Striker', abbreviation: 'ST', x: 75, y: 60 },
    ],
  },
  {
    id: '2-3-3-9v9',
    name: '2-3-3',
    gameFormat: '9v9',
    playersPerSide: 9,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 30, y: 40 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 30, y: 60 },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 50, y: 25 },
      {
        id: 'cm',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 50,
        y: 50,
      },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 50, y: 75 },
      { id: 'rw', name: 'Right Winger', abbreviation: 'RW', x: 70, y: 30 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 70, y: 50 },
      { id: 'lw', name: 'Left Winger', abbreviation: 'LW', x: 70, y: 70 },
    ],
  },
  {
    id: '3-4-1-9v9',
    name: '3-4-1',
    gameFormat: '9v9',
    playersPerSide: 9,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'lb', name: 'Left Back', abbreviation: 'LB', x: 30, y: 25 },
      { id: 'cb', name: 'Center Back', abbreviation: 'CB', x: 30, y: 50 },
      { id: 'rb', name: 'Right Back', abbreviation: 'RB', x: 30, y: 75 },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 55, y: 20 },
      {
        id: 'cm1',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 40,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 60,
      },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 55, y: 80 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 75, y: 50 },
    ],
  },
  // 7v7 formations
  {
    id: '2-3-1-7v7',
    name: '2-3-1',
    gameFormat: '7v7',
    playersPerSide: 7,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'cb1', name: 'Center Back', abbreviation: 'CB', x: 30, y: 35 },
      { id: 'cb2', name: 'Center Back', abbreviation: 'CB', x: 30, y: 65 },
      { id: 'rm', name: 'Right Midfielder', abbreviation: 'RM', x: 55, y: 25 },
      {
        id: 'cm',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 55,
        y: 50,
      },
      { id: 'lm', name: 'Left Midfielder', abbreviation: 'LM', x: 55, y: 75 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 75, y: 50 },
    ],
  },
  // 5v5 formations
  {
    id: '1-2-1-5v5',
    name: '1-2-1',
    gameFormat: '5v5',
    playersPerSide: 5,
    isActive: true,
    positions: [
      { id: 'gk', name: 'Goalkeeper', abbreviation: 'GK', x: 10, y: 50 },
      { id: 'def', name: 'Defender', abbreviation: 'DEF', x: 35, y: 50 },
      { id: 'rm', name: 'Right Mid', abbreviation: 'RM', x: 55, y: 30 },
      { id: 'lm', name: 'Left Mid', abbreviation: 'LM', x: 55, y: 70 },
      { id: 'st', name: 'Striker', abbreviation: 'ST', x: 75, y: 50 },
    ],
  },
];

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
          pos.id === positionId ? { ...pos, ...updates } : pos
        )
      );
    },
    []
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
