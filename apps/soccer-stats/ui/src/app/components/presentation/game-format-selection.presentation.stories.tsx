import { UIGameFormat } from '../types/ui.types';

import { GameFormatSelectionPresentation } from './game-format-selection.presentation';

const meta = {
  title: 'Components/Presentation/GameFormatSelection',
  component: GameFormatSelectionPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onFormatSelect: { action: 'format selected' },
    onNext: { action: 'next clicked' },
    onPrevious: { action: 'previous clicked' },
    isTabMode: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample game formats data
const sampleGameFormats: UIGameFormat[] = [
  {
    id: '5v5',
    name: '5 vs 5',
    playerCount: 5,
    description: 'Small-sided games, perfect for youth teams and training',
  },
  {
    id: '7v7',
    name: '7 vs 7',
    playerCount: 7,
    description: 'Popular format for youth leagues and recreational play',
  },
  {
    id: '9v9',
    name: '9 vs 9',
    playerCount: 9,
    description: 'Intermediate format building towards full field play',
  },
  {
    id: '11v11',
    name: '11 vs 11',
    playerCount: 11,
    description: 'Full field soccer, professional and adult league standard',
  },
];

export const Default = {
  args: {
    gameFormats: sampleGameFormats,
    selectedFormat: undefined,
    isTabMode: false,
  },
};

export const WithSelectedFormat = {
  args: {
    gameFormats: sampleGameFormats,
    selectedFormat: '11v11',
    isTabMode: false,
  },
};

export const TabMode = {
  args: {
    gameFormats: sampleGameFormats,
    selectedFormat: '7v7',
    isTabMode: true,
  },
};

export const YouthFormats = {
  args: {
    gameFormats: [
      {
        id: '5v5',
        name: '5 vs 5',
        playerCount: 5,
        description: 'Perfect for U8 and U10 age groups',
      },
      {
        id: '7v7',
        name: '7 vs 7',
        playerCount: 7,
        description: 'Ideal for U12 and U14 development',
      },
      {
        id: '9v9',
        name: '9 vs 9',
        playerCount: 9,
        description: 'Great transition format for U16',
      },
    ],
    selectedFormat: '7v7',
    isTabMode: false,
  },
};

export const ProfessionalFormats = {
  args: {
    gameFormats: [
      {
        id: '11v11',
        name: '11 vs 11',
        playerCount: 11,
        description: 'Standard professional soccer format',
      },
    ],
    selectedFormat: '11v11',
    isTabMode: false,
  },
};

export const EmptyState = {
  args: {
    gameFormats: [],
    selectedFormat: undefined,
    isTabMode: false,
  },
};
