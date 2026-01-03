/**
 * Standard soccer positions used across the application.
 * These positions are used for player assignment and lineup management.
 */
export const SOCCER_POSITIONS = [
  'Goalkeeper',
  'Defender',
  'Left Back',
  'Right Back',
  'Center Back',
  'Midfielder',
  'Left Midfielder',
  'Right Midfielder',
  'Central Midfielder',
  'Defensive Midfielder',
  'Attacking Midfielder',
  'Forward',
  'Left Wing',
  'Right Wing',
  'Striker',
] as const;

export type SoccerPosition = (typeof SOCCER_POSITIONS)[number];
