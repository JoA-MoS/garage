import { SubstitutionsTabPresentation } from './substitutions-tab.presentation';

const meta = {
  title: 'Components/Presentation/SubstitutionsTab',
  component: SubstitutionsTabPresentation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubstitute: { action: 'substitute made' },
  },
};

export default meta;

// Sample player data
const createPlayer = (
  id: number,
  name: string,
  jersey: number,
  position: string,
  isOnField: boolean,
  playTime: number
) => ({
  id,
  name,
  jersey,
  position,
  depthRank: 1,
  playTime,
  isOnField,
});

const playersOnField = [
  createPlayer(1, 'Lionel Messi', 10, 'Forward', true, 4500), // 75 minutes - tired
  createPlayer(2, 'Kevin De Bruyne', 17, 'Midfielder', true, 2700), // 45 minutes
  createPlayer(3, 'Virgil van Dijk', 4, 'Defender', true, 2700),
  createPlayer(4, 'Marc-André ter Stegen', 1, 'Goalkeeper', true, 2700),
  createPlayer(5, 'Sadio Mané', 11, 'Forward', true, 2400),
  createPlayer(6, 'Joshua Kimmich', 6, 'Midfielder', true, 2400),
  createPlayer(7, 'Raphaël Varane', 5, 'Defender', true, 2400),
  createPlayer(8, 'Sergio Busquets', 16, 'Midfielder', true, 4200), // 70 minutes - tired
  createPlayer(9, 'João Cancelo', 2, 'Defender', true, 2100),
  createPlayer(10, 'Karim Benzema', 9, 'Forward', true, 1800),
  createPlayer(11, 'Jordi Alba', 18, 'Defender', true, 1800),
];

const playersOnBench = [
  createPlayer(12, 'Cristiano Ronaldo', 7, 'Forward', false, 0),
  createPlayer(13, 'Luka Modrić', 8, 'Midfielder', false, 300),
  createPlayer(14, 'Paulo Dybala', 21, 'Forward', false, 0),
  createPlayer(15, 'Marco Verratti', 23, 'Midfielder', false, 0),
  createPlayer(16, 'Gianluigi Donnarumma', 99, 'Goalkeeper', false, 0),
  createPlayer(17, 'Fresh Player', 24, 'Midfielder', false, 0),
];

const substitutionRecommendations = [
  {
    playerOut: playersOnField[0], // Messi (tired after 75 min)
    playerIn: playersOnBench[0], // Cristiano Ronaldo
    reason: 'Player fatigue detected - 75+ minutes played',
  },
  {
    playerOut: playersOnField[7], // Busquets (tired after 70 min)
    playerIn: playersOnBench[3], // Marco Verratti
    reason: 'Player fatigue detected - 70+ minutes played',
  },
  {
    playerOut: playersOnField[1], // De Bruyne
    playerIn: playersOnBench[5], // Fresh Player
    reason: 'Fresh legs needed in midfield',
  },
];

const noRecommendations = [];

export const WithRecommendations = {
  args: {
    substitutionRecommendations,
    playersOnField,
    playersOnBench,
  },
};

export const NoRecommendations = {
  args: {
    substitutionRecommendations: noRecommendations,
    playersOnField: playersOnField.slice(0, 8),
    playersOnBench: playersOnBench.slice(0, 3),
  },
};

export const SingleRecommendation = {
  args: {
    substitutionRecommendations: [substitutionRecommendations[0]],
    playersOnField,
    playersOnBench,
  },
};

export const ManyRecommendations = {
  args: {
    substitutionRecommendations: [
      ...substitutionRecommendations,
      {
        playerOut: playersOnField[4], // Sadio Mané
        playerIn: playersOnBench[2], // Paulo Dybala
        reason: 'Tactical change - need more pace on the wing',
      },
      {
        playerOut: playersOnField[6], // Raphaël Varane
        playerIn: playersOnBench[1], // Luka Modrić (unusual but for demo)
        reason: 'Injury concern - precautionary substitution',
      },
    ],
    playersOnField,
    playersOnBench,
  },
};

export const SmallSquad = {
  args: {
    substitutionRecommendations: [substitutionRecommendations[0]],
    playersOnField: playersOnField.slice(0, 6),
    playersOnBench: playersOnBench.slice(0, 2),
  },
};

export const LargeBench = {
  args: {
    substitutionRecommendations,
    playersOnField: playersOnField.slice(0, 9),
    playersOnBench: [
      ...playersOnBench,
      createPlayer(18, 'Additional Sub 1', 25, 'Forward', false, 0),
      createPlayer(19, 'Additional Sub 2', 26, 'Defender', false, 0),
      createPlayer(20, 'Additional Sub 3', 27, 'Midfielder', false, 0),
    ],
  },
};

export const VaryingPlayTimes = {
  args: {
    substitutionRecommendations: noRecommendations,
    playersOnField: [
      createPlayer(1, 'Full Game Player', 10, 'Forward', true, 5400), // 90 minutes
      createPlayer(2, 'Late Starter', 17, 'Midfielder', true, 600), // 10 minutes
      createPlayer(3, 'Mid Game Entry', 4, 'Defender', true, 1800), // 30 minutes
      createPlayer(4, 'Early Starter', 1, 'Goalkeeper', true, 4500), // 75 minutes
      createPlayer(5, 'Recent Sub', 11, 'Forward', true, 300), // 5 minutes
    ],
    playersOnBench: [
      createPlayer(6, 'Unused Sub', 7, 'Forward', false, 0),
      createPlayer(7, 'Previous Player', 8, 'Midfielder', false, 3600), // Was on field for 60 min
    ],
  },
};
