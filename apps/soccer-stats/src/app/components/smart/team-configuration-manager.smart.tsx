import { useState, useCallback } from 'react';

import {
  UIPosition,
  UIGameFormat,
  UIFormation,
  UITeamConfiguration,
} from '../types/ui.types';

// Sample game formats
const GAME_FORMATS: UIGameFormat[] = [
  {
    id: '11v11',
    name: '11v11',
    playerCount: 11,
    description:
      'Full field soccer with 11 players per side, including goalkeeper',
  },
  {
    id: '9v9',
    name: '9v9',
    playerCount: 9,
    description:
      'Modified field soccer with 9 players per side, common in youth leagues',
  },
  {
    id: '7v7',
    name: '7v7',
    playerCount: 7,
    description:
      'Small field soccer with 7 players per side, including goalkeeper',
  },
  {
    id: '5v5',
    name: '5v5',
    playerCount: 5,
    description: 'Futsal or small field soccer with 5 players per side',
  },
];

// Sample formations for different game formats
const FORMATIONS: UIFormation[] = [
  // 11v11 formations
  {
    id: '4-4-2-11v11',
    name: '4-4-2',
    gameFormat: '11v11',
    playerCount: 11,
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
    playerCount: 11,
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
    playerCount: 11,
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
        x: 45,
        y: 35,
      },
      {
        id: 'cm2',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 45,
        y: 50,
      },
      {
        id: 'cm3',
        name: 'Central Midfielder',
        abbreviation: 'CM',
        x: 45,
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
    playerCount: 9,
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
    playerCount: 9,
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
    playerCount: 9,
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
    playerCount: 7,
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
    playerCount: 5,
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
  const [configuration, setConfiguration] = useState<UITeamConfiguration>({});

  const [positions, setPositions] = useState<UIPosition[]>([]);

  const handleGameFormatSelect = useCallback((formatId: string) => {
    setConfiguration((prev) => ({
      ...prev,
      gameFormat: formatId,
      formation: undefined, // Reset formation when format changes
    }));
    setPositions([]); // Reset positions when format changes
  }, []);

  const handleFormationSelect = useCallback((formationId: string) => {
    const formation = FORMATIONS.find((f) => f.id === formationId);
    if (formation) {
      setConfiguration((prev) => ({
        ...prev,
        formation: formationId,
      }));
      setPositions([...formation.positions]); // Copy positions so they can be modified
    }
  }, []);

  const handlePositionUpdate = useCallback(
    (positionId: string, updates: Partial<UIPosition>) => {
      setPositions((prev) =>
        prev.map((pos) =>
          pos.id === positionId ? { ...pos, ...updates } : pos
        )
      );
    },
    []
  );

  const handleAddPosition = useCallback(() => {
    const newPosition = {
      id: `pos_${crypto.randomUUID()}`,
      name: 'New Position',
      abbreviation: 'NP',
      x: 50,
      y: 50,
    };
    setPositions((prev) => [...prev, newPosition]);
  }, []);

  const handleRemovePosition = useCallback((positionId: string) => {
    setPositions((prev) => prev.filter((pos) => pos.id !== positionId));
  }, []);

  return {
    gameFormats: GAME_FORMATS,
    formations: FORMATIONS,
    configuration,
    positions,
    actions: {
      selectGameFormat: handleGameFormatSelect,
      selectFormation: handleFormationSelect,
      updatePosition: handlePositionUpdate,
      addPosition: handleAddPosition,
      removePosition: handleRemovePosition,
    },
  };
};
