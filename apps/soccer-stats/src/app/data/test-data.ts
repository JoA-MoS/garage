import { Team, Player, GameConfig } from '../types';

/**
 * Test data for development - pre-populated teams to avoid manual entry
 */

// Common soccer positions
const POSITIONS = [
  'Goalkeeper',
  'Center Back',
  'Left Back',
  'Right Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Left Winger',
  'Right Winger',
  'Striker',
  'Center Forward',
];

/**
 * Generate a realistic test player
 */
function createTestPlayer(
  id: number,
  name: string,
  jersey: number,
  position: string,
  depthRank: number,
  isStarter = false
): Player {
  return {
    id,
    name,
    jersey,
    position,
    depthRank,
    playTime: 0,
    isOnField: isStarter,
  };
}

/**
 * Pre-populated home team (Barcelona-style)
 */
export const testHomeTeam: Team = {
  name: 'FC Barcelona',
  players: [
    // Starters (Formation: 4-3-3)
    createTestPlayer(1, 'Marc-André ter Stegen', 1, 'Goalkeeper', 1, true),
    createTestPlayer(2, 'Jules Koundé', 23, 'Right Back', 1, true),
    createTestPlayer(3, 'Ronald Araújo', 4, 'Center Back', 1, true),
    createTestPlayer(4, 'Pau Cubarsí', 2, 'Center Back', 2, true),
    createTestPlayer(5, 'Alejandro Balde', 3, 'Left Back', 1, true),
    createTestPlayer(6, 'Pedri', 8, 'Central Midfielder', 1, true),
    createTestPlayer(7, 'Frenkie de Jong', 21, 'Central Midfielder', 1, true),
    createTestPlayer(8, 'Gavi', 6, 'Central Midfielder', 2, true),
    createTestPlayer(9, 'Robert Lewandowski', 9, 'Striker', 1, true),
    createTestPlayer(10, 'Raphinha', 11, 'Right Winger', 1, true),
    createTestPlayer(11, 'Ferran Torres', 7, 'Left Winger', 1, true),

    // Substitutes
    createTestPlayer(12, 'Iñaki Peña', 13, 'Goalkeeper', 2),
    createTestPlayer(13, 'Héctor Fort', 32, 'Right Back', 2),
    createTestPlayer(14, 'Andreas Christensen', 15, 'Center Back', 3),
    createTestPlayer(15, 'Sergi Roberto', 20, 'Central Midfielder', 3),
    createTestPlayer(16, 'Ilkay Gündogan', 22, 'Central Midfielder', 2),
    createTestPlayer(17, 'Fermín López', 16, 'Attacking Midfielder', 1),
    createTestPlayer(18, 'Lamine Yamal', 27, 'Right Winger', 2),
    createTestPlayer(19, 'João Félix', 14, 'Left Winger', 2),
    createTestPlayer(20, 'Pau Víctor', 18, 'Striker', 2),
  ],
  goals: [],
};

/**
 * Pre-populated away team (Real Madrid-style)
 */
export const testAwayTeam: Team = {
  name: 'Real Madrid',
  players: [
    // Starters (Formation: 4-3-3)
    createTestPlayer(21, 'Thibaut Courtois', 1, 'Goalkeeper', 1, true),
    createTestPlayer(22, 'Dani Carvajal', 2, 'Right Back', 1, true),
    createTestPlayer(23, 'Éder Militão', 3, 'Center Back', 1, true),
    createTestPlayer(24, 'Antonio Rüdiger', 22, 'Center Back', 1, true),
    createTestPlayer(25, 'Ferland Mendy', 23, 'Left Back', 1, true),
    createTestPlayer(
      26,
      'Aurelién Tchouaméni',
      18,
      'Defensive Midfielder',
      1,
      true
    ),
    createTestPlayer(27, 'Luka Modrić', 10, 'Central Midfielder', 1, true),
    createTestPlayer(28, 'Jude Bellingham', 5, 'Attacking Midfielder', 1, true),
    createTestPlayer(29, 'Vinícius Jr.', 7, 'Left Winger', 1, true),
    createTestPlayer(30, 'Karim Benzema', 9, 'Striker', 1, true),
    createTestPlayer(31, 'Rodrygo', 11, 'Right Winger', 1, true),

    // Substitutes
    createTestPlayer(32, 'Andriy Lunin', 13, 'Goalkeeper', 2),
    createTestPlayer(33, 'Lucas Vázquez', 17, 'Right Back', 2),
    createTestPlayer(34, 'Nacho Fernández', 6, 'Center Back', 2),
    createTestPlayer(35, 'Eduardo Camavinga', 12, 'Central Midfielder', 2),
    createTestPlayer(36, 'Toni Kroos', 8, 'Central Midfielder', 2),
    createTestPlayer(37, 'Federico Valverde', 15, 'Central Midfielder', 3),
    createTestPlayer(38, 'Brahim Díaz', 21, 'Attacking Midfielder', 2),
    createTestPlayer(39, 'Marco Asensio', 11, 'Right Winger', 2),
    createTestPlayer(40, 'Joselu', 14, 'Striker', 2),
  ],
  goals: [],
};

/**
 * Test game configuration
 */
export const testGameConfig: GameConfig = {
  playersPerTeam: 20,
  playersOnField: 11,
  positions: POSITIONS,
  homeTeamName: testHomeTeam.name,
  awayTeamName: testAwayTeam.name,
};

/**
 * Alternative smaller teams for quick testing
 */
export const testHomeTeamSmall: Team = {
  name: 'City FC',
  players: [
    // Starters (5-a-side)
    createTestPlayer(1, 'Alex Johnson', 1, 'Goalkeeper', 1, true),
    createTestPlayer(2, 'Sam Wilson', 2, 'Defender', 1, true),
    createTestPlayer(3, 'Chris Lee', 3, 'Midfielder', 1, true),
    createTestPlayer(4, 'Jordan Smith', 4, 'Midfielder', 1, true),
    createTestPlayer(5, 'Taylor Brown', 5, 'Forward', 1, true),

    // Substitutes
    createTestPlayer(6, 'Morgan Davis', 6, 'Goalkeeper', 2),
    createTestPlayer(7, 'Casey Martinez', 7, 'Defender', 2),
    createTestPlayer(8, 'Riley Garcia', 8, 'Midfielder', 2),
    createTestPlayer(9, 'Drew Anderson', 9, 'Forward', 2),
    createTestPlayer(10, 'Parker Thompson', 10, 'Forward', 3),
  ],
  goals: [],
};

export const testAwayTeamSmall: Team = {
  name: 'United FC',
  players: [
    // Starters (5-a-side)
    createTestPlayer(11, 'Jamie Rodriguez', 1, 'Goalkeeper', 1, true),
    createTestPlayer(12, 'Avery Williams', 2, 'Defender', 1, true),
    createTestPlayer(13, 'Quinn Miller', 3, 'Midfielder', 1, true),
    createTestPlayer(14, 'Sage Jones', 4, 'Midfielder', 1, true),
    createTestPlayer(15, 'Phoenix Taylor', 5, 'Forward', 1, true),

    // Substitutes
    createTestPlayer(16, 'River Clark', 6, 'Goalkeeper', 2),
    createTestPlayer(17, 'Blake Lewis', 7, 'Defender', 2),
    createTestPlayer(18, 'Rowan Walker', 8, 'Midfielder', 2),
    createTestPlayer(19, 'Skyler Hall', 9, 'Forward', 2),
    createTestPlayer(20, 'Cameron Young', 10, 'Forward', 3),
  ],
  goals: [],
};

export const testGameConfigSmall: GameConfig = {
  playersPerTeam: 10,
  playersOnField: 5,
  positions: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  homeTeamName: testHomeTeamSmall.name,
  awayTeamName: testAwayTeamSmall.name,
};

/**
 * 9v9 Teams (U12/U13 format)
 */
export const testHomeTeam9v9: Team = {
  name: 'Eagles FC',
  players: [
    // Starters (Formation: 3-3-2)
    createTestPlayer(1, 'Emma Rodriguez', 1, 'Goalkeeper', 1, true),
    createTestPlayer(2, 'Jake Thompson', 2, 'Center Back', 1, true),
    createTestPlayer(3, 'Maya Patel', 3, 'Center Back', 1, true),
    createTestPlayer(4, 'Alex Chen', 4, 'Center Back', 2, true),
    createTestPlayer(5, 'Jordan Williams', 5, 'Left Midfielder', 1, true),
    createTestPlayer(6, 'Sam Johnson', 6, 'Central Midfielder', 1, true),
    createTestPlayer(7, 'Riley Martinez', 7, 'Right Midfielder', 1, true),
    createTestPlayer(8, 'Casey Brown', 8, 'Left Forward', 1, true),
    createTestPlayer(9, 'Taylor Davis', 9, 'Right Forward', 1, true),

    // Substitutes
    createTestPlayer(10, 'Morgan Garcia', 10, 'Goalkeeper', 2),
    createTestPlayer(11, 'Avery Wilson', 11, 'Center Back', 3),
    createTestPlayer(12, 'Phoenix Lee', 12, 'Central Midfielder', 2),
    createTestPlayer(13, 'River Anderson', 13, 'Left Midfielder', 2),
    createTestPlayer(14, 'Sage Mitchell', 14, 'Right Midfielder', 2),
    createTestPlayer(15, 'Blake Turner', 15, 'Left Forward', 2),
    createTestPlayer(16, 'Rowan Cooper', 16, 'Right Forward', 2),
  ],
  goals: [],
};

export const testAwayTeam9v9: Team = {
  name: 'Lions United',
  players: [
    // Starters (Formation: 3-3-2)
    createTestPlayer(17, 'Quinn Roberts', 1, 'Goalkeeper', 1, true),
    createTestPlayer(18, 'Skyler Thompson', 2, 'Center Back', 1, true),
    createTestPlayer(19, 'Cameron White', 3, 'Center Back', 1, true),
    createTestPlayer(20, 'Drew Jackson', 4, 'Center Back', 2, true),
    createTestPlayer(21, 'Finley Moore', 5, 'Left Midfielder', 1, true),
    createTestPlayer(22, 'Emery Taylor', 6, 'Central Midfielder', 1, true),
    createTestPlayer(23, 'Reese Clark', 7, 'Right Midfielder', 1, true),
    createTestPlayer(24, 'Hayden Lewis', 8, 'Left Forward', 1, true),
    createTestPlayer(25, 'Peyton Walker', 9, 'Right Forward', 1, true),

    // Substitutes
    createTestPlayer(26, 'Kendall Hall', 10, 'Goalkeeper', 2),
    createTestPlayer(27, 'Remy Young', 11, 'Center Back', 3),
    createTestPlayer(28, 'Oakley King', 12, 'Central Midfielder', 2),
    createTestPlayer(29, 'Bryn Scott', 13, 'Left Midfielder', 2),
    createTestPlayer(30, 'Ellis Green', 14, 'Right Midfielder', 2),
    createTestPlayer(31, 'Marlowe Adams', 15, 'Left Forward', 2),
    createTestPlayer(32, 'Indie Baker', 16, 'Right Forward', 2),
  ],
  goals: [],
};

export const testGameConfig9v9: GameConfig = {
  playersPerTeam: 16,
  playersOnField: 9,
  positions: [
    'Goalkeeper',
    'Center Back',
    'Left Midfielder',
    'Central Midfielder',
    'Right Midfielder',
    'Left Forward',
    'Right Forward',
  ],
  homeTeamName: testHomeTeam9v9.name,
  awayTeamName: testAwayTeam9v9.name,
};

/**
 * 7v7 Teams (U10/U11 format)
 */
export const testHomeTeam7v7: Team = {
  name: 'Sharks FC',
  players: [
    // Starters (Formation: 2-3-1)
    createTestPlayer(33, 'Nova Martinez', 1, 'Goalkeeper', 1, true),
    createTestPlayer(34, 'Zion Thompson', 2, 'Left Back', 1, true),
    createTestPlayer(35, 'Luna Garcia', 3, 'Right Back', 1, true),
    createTestPlayer(36, 'Atlas Johnson', 4, 'Left Midfielder', 1, true),
    createTestPlayer(37, 'Iris Wilson', 5, 'Central Midfielder', 1, true),
    createTestPlayer(38, 'Orion Davis', 6, 'Right Midfielder', 1, true),
    createTestPlayer(39, 'Stella Brown', 7, 'Forward', 1, true),

    // Substitutes
    createTestPlayer(40, 'Leo Miller', 8, 'Goalkeeper', 2),
    createTestPlayer(41, 'Aria Jones', 9, 'Left Back', 2),
    createTestPlayer(42, 'Kai Williams', 10, 'Right Back', 2),
    createTestPlayer(43, 'Zara Rodriguez', 11, 'Left Midfielder', 2),
    createTestPlayer(44, 'Felix Anderson', 12, 'Central Midfielder', 2),
    createTestPlayer(45, 'Ruby Thomas', 13, 'Right Midfielder', 2),
    createTestPlayer(46, 'Milo Jackson', 14, 'Forward', 2),
  ],
  goals: [],
};

export const testAwayTeam7v7: Team = {
  name: 'Tigers Academy',
  players: [
    // Starters (Formation: 2-3-1)
    createTestPlayer(47, 'Sage White', 1, 'Goalkeeper', 1, true),
    createTestPlayer(48, 'River Martinez', 2, 'Left Back', 1, true),
    createTestPlayer(49, 'Wren Clark', 3, 'Right Back', 1, true),
    createTestPlayer(50, 'Rowan Lewis', 4, 'Left Midfielder', 1, true),
    createTestPlayer(51, 'Ember Walker', 5, 'Central Midfielder', 1, true),
    createTestPlayer(52, 'Ocean Hall', 6, 'Right Midfielder', 1, true),
    createTestPlayer(53, 'Storm Young', 7, 'Forward', 1, true),

    // Substitutes
    createTestPlayer(54, 'Phoenix Allen', 8, 'Goalkeeper', 2),
    createTestPlayer(55, 'Sage King', 9, 'Left Back', 2),
    createTestPlayer(56, 'Vale Scott', 10, 'Right Back', 2),
    createTestPlayer(57, 'Rain Green', 11, 'Left Midfielder', 2),
    createTestPlayer(58, 'Skye Adams', 12, 'Central Midfielder', 2),
    createTestPlayer(59, 'Echo Baker', 13, 'Right Midfielder', 2),
    createTestPlayer(60, 'Blaze Nelson', 14, 'Forward', 2),
  ],
  goals: [],
};

export const testGameConfig7v7: GameConfig = {
  playersPerTeam: 14,
  playersOnField: 7,
  positions: [
    'Goalkeeper',
    'Left Back',
    'Right Back',
    'Left Midfielder',
    'Central Midfielder',
    'Right Midfielder',
    'Forward',
  ],
  homeTeamName: testHomeTeam7v7.name,
  awayTeamName: testAwayTeam7v7.name,
};
