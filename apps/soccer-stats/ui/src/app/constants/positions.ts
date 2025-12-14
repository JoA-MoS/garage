// Formation positions for soccer
export const POSITIONS = {
  GK: { code: 'GK', name: 'Goalkeeper', category: 'defense' },
  LB: { code: 'LB', name: 'Left Back', category: 'defense' },
  CB: { code: 'CB', name: 'Center Back', category: 'defense' },
  RB: { code: 'RB', name: 'Right Back', category: 'defense' },
  LWB: { code: 'LWB', name: 'Left Wing Back', category: 'defense' },
  RWB: { code: 'RWB', name: 'Right Wing Back', category: 'defense' },
  CDM: { code: 'CDM', name: 'Defensive Midfielder', category: 'midfield' },
  CM: { code: 'CM', name: 'Central Midfielder', category: 'midfield' },
  CAM: { code: 'CAM', name: 'Attacking Midfielder', category: 'midfield' },
  LM: { code: 'LM', name: 'Left Midfielder', category: 'midfield' },
  RM: { code: 'RM', name: 'Right Midfielder', category: 'midfield' },
  LW: { code: 'LW', name: 'Left Wing', category: 'attack' },
  RW: { code: 'RW', name: 'Right Wing', category: 'attack' },
  CF: { code: 'CF', name: 'Center Forward', category: 'attack' },
  ST: { code: 'ST', name: 'Striker', category: 'attack' },
} as const;

export type PositionCode = keyof typeof POSITIONS;

// Formation definitions with position layouts
// Positions are defined as percentages [x, y] from top-left of field
// x: 0 = left sideline, 100 = right sideline
// y: 0 = own goal line, 100 = opponent goal line
export interface FormationPosition {
  position: PositionCode;
  x: number;
  y: number;
}

export interface Formation {
  name: string;
  code: string;
  playersPerTeam: number;
  positions: FormationPosition[];
}

// 11v11 formations
export const FORMATIONS_11V11: Formation[] = [
  {
    name: '4-4-2',
    code: '4-4-2',
    playersPerTeam: 11,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'LB', x: 15, y: 25 },
      { position: 'CB', x: 35, y: 20 },
      { position: 'CB', x: 65, y: 20 },
      { position: 'RB', x: 85, y: 25 },
      { position: 'LM', x: 15, y: 50 },
      { position: 'CM', x: 35, y: 45 },
      { position: 'CM', x: 65, y: 45 },
      { position: 'RM', x: 85, y: 50 },
      { position: 'ST', x: 35, y: 75 },
      { position: 'ST', x: 65, y: 75 },
    ],
  },
  {
    name: '4-3-3',
    code: '4-3-3',
    playersPerTeam: 11,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'LB', x: 15, y: 25 },
      { position: 'CB', x: 35, y: 20 },
      { position: 'CB', x: 65, y: 20 },
      { position: 'RB', x: 85, y: 25 },
      { position: 'CM', x: 30, y: 45 },
      { position: 'CDM', x: 50, y: 40 },
      { position: 'CM', x: 70, y: 45 },
      { position: 'LW', x: 20, y: 70 },
      { position: 'ST', x: 50, y: 80 },
      { position: 'RW', x: 80, y: 70 },
    ],
  },
  {
    name: '3-5-2',
    code: '3-5-2',
    playersPerTeam: 11,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'CB', x: 25, y: 20 },
      { position: 'CB', x: 50, y: 15 },
      { position: 'CB', x: 75, y: 20 },
      { position: 'LWB', x: 10, y: 45 },
      { position: 'CM', x: 30, y: 40 },
      { position: 'CDM', x: 50, y: 35 },
      { position: 'CM', x: 70, y: 40 },
      { position: 'RWB', x: 90, y: 45 },
      { position: 'ST', x: 35, y: 75 },
      { position: 'ST', x: 65, y: 75 },
    ],
  },
];

// 9v9 formations (U12)
export const FORMATIONS_9V9: Formation[] = [
  {
    name: '3-3-2',
    code: '3-3-2',
    playersPerTeam: 9,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'LB', x: 20, y: 25 },
      { position: 'CB', x: 50, y: 20 },
      { position: 'RB', x: 80, y: 25 },
      { position: 'LM', x: 20, y: 50 },
      { position: 'CM', x: 50, y: 45 },
      { position: 'RM', x: 80, y: 50 },
      { position: 'ST', x: 35, y: 75 },
      { position: 'ST', x: 65, y: 75 },
    ],
  },
  {
    name: '2-4-2',
    code: '2-4-2',
    playersPerTeam: 9,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'CB', x: 35, y: 20 },
      { position: 'CB', x: 65, y: 20 },
      { position: 'LM', x: 15, y: 45 },
      { position: 'CM', x: 38, y: 40 },
      { position: 'CM', x: 62, y: 40 },
      { position: 'RM', x: 85, y: 45 },
      { position: 'ST', x: 35, y: 75 },
      { position: 'ST', x: 65, y: 75 },
    ],
  },
];

// 7v7 formations (U10)
export const FORMATIONS_7V7: Formation[] = [
  {
    name: '3-2-1',
    code: '3-2-1',
    playersPerTeam: 7,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'LB', x: 20, y: 25 },
      { position: 'CB', x: 50, y: 20 },
      { position: 'RB', x: 80, y: 25 },
      { position: 'LM', x: 30, y: 50 },
      { position: 'RM', x: 70, y: 50 },
      { position: 'ST', x: 50, y: 75 },
    ],
  },
  {
    name: '2-3-1',
    code: '2-3-1',
    playersPerTeam: 7,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'CB', x: 35, y: 20 },
      { position: 'CB', x: 65, y: 20 },
      { position: 'LM', x: 20, y: 50 },
      { position: 'CM', x: 50, y: 45 },
      { position: 'RM', x: 80, y: 50 },
      { position: 'ST', x: 50, y: 75 },
    ],
  },
];

// 5v5 formations (U8)
export const FORMATIONS_5V5: Formation[] = [
  {
    name: '2-2',
    code: '2-2',
    playersPerTeam: 5,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'CB', x: 30, y: 30 },
      { position: 'CB', x: 70, y: 30 },
      { position: 'ST', x: 30, y: 70 },
      { position: 'ST', x: 70, y: 70 },
    ],
  },
  {
    name: '1-2-1',
    code: '1-2-1',
    playersPerTeam: 5,
    positions: [
      { position: 'GK', x: 50, y: 5 },
      { position: 'CB', x: 50, y: 25 },
      { position: 'LM', x: 25, y: 50 },
      { position: 'RM', x: 75, y: 50 },
      { position: 'ST', x: 50, y: 75 },
    ],
  },
];

// 3v3 formations (U6)
export const FORMATIONS_3V3: Formation[] = [
  {
    name: '2-0',
    code: '2-0',
    playersPerTeam: 3,
    positions: [
      { position: 'GK', x: 50, y: 10 },
      { position: 'LM', x: 30, y: 50 },
      { position: 'RM', x: 70, y: 50 },
    ],
  },
  {
    name: '1-1',
    code: '1-1',
    playersPerTeam: 3,
    positions: [
      { position: 'GK', x: 50, y: 10 },
      { position: 'CB', x: 50, y: 35 },
      { position: 'ST', x: 50, y: 70 },
    ],
  },
];

// Get formations by players per team
export function getFormationsForTeamSize(playersPerTeam: number): Formation[] {
  switch (playersPerTeam) {
    case 3:
      return FORMATIONS_3V3;
    case 5:
      return FORMATIONS_5V5;
    case 7:
      return FORMATIONS_7V7;
    case 9:
      return FORMATIONS_9V9;
    case 11:
      return FORMATIONS_11V11;
    default:
      return FORMATIONS_11V11;
  }
}

// Get default formation for team size
export function getDefaultFormation(playersPerTeam: number): Formation {
  const formations = getFormationsForTeamSize(playersPerTeam);
  return formations[0];
}

// All formations combined
export const ALL_FORMATIONS: Formation[] = [
  ...FORMATIONS_3V3,
  ...FORMATIONS_5V5,
  ...FORMATIONS_7V7,
  ...FORMATIONS_9V9,
  ...FORMATIONS_11V11,
];
