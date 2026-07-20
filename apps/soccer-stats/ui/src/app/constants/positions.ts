// Formation and position definitions live in the shared utils library so the
// API can validate lineups against the same catalog the UI renders. Only the
// formation/position surface is re-exported here — import other utilities
// from @garage/soccer-stats/utils directly.
export {
  POSITIONS,
  FORMATIONS_11V11,
  FORMATIONS_9V9,
  FORMATIONS_7V7,
  FORMATIONS_5V5,
  FORMATIONS_4V4,
  FORMATIONS_3V3,
  ALL_FORMATIONS,
  getFormationsForTeamSize,
  getDefaultFormation,
  getPositionSlotCount,
} from '@garage/soccer-stats/utils';
export type {
  PositionCode,
  Formation,
  FormationPosition,
} from '@garage/soccer-stats/utils';
