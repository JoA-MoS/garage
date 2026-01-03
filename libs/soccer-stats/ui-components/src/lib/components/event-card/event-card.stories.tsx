import type { Meta, StoryObj } from '@storybook/react-vite';

import { EventCard } from './event-card';

const meta: Meta<typeof EventCard> = {
  component: EventCard,
  title: 'Components/EventCard',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EventCard>;

export const Goal: Story = {
  args: {
    id: '1',
    eventType: 'goal',
    gameMinute: 23,
    gameSecond: 45,
    teamName: 'Barcelona',
    teamColor: '#a50044',
    scorerName: 'Lionel Messi',
    assisterName: 'Andrés Iniesta',
  },
};

export const GoalNoAssist: Story = {
  args: {
    id: '2',
    eventType: 'goal',
    gameMinute: 67,
    gameSecond: 12,
    teamName: 'Real Madrid',
    teamColor: '#ffffff',
    scorerName: 'Karim Benzema',
  },
};

export const Substitution: Story = {
  args: {
    id: '3',
    eventType: 'substitution',
    gameMinute: 60,
    gameSecond: 0,
    teamName: 'Barcelona',
    teamColor: '#a50044',
    playerInName: 'Pedri',
    playerOutName: 'Sergio Busquets',
  },
};

export const PositionSwap: Story = {
  args: {
    id: '4',
    eventType: 'position_swap',
    gameMinute: 35,
    gameSecond: 22,
    teamName: 'Real Madrid',
    teamColor: '#ffffff',
    player1Name: 'Vinícius Jr.',
    player1Position: 'LW',
    player2Name: 'Rodrygo',
    player2Position: 'RW',
  },
};

export const StarterEntry: Story = {
  args: {
    id: '5',
    eventType: 'starter_entry',
    gameMinute: 0,
    gameSecond: 0,
    teamName: 'Barcelona',
    teamColor: '#a50044',
    playerInName: 'Gavi',
  },
};

export const WithHighlight: Story = {
  args: {
    id: '6',
    eventType: 'goal',
    gameMinute: 89,
    gameSecond: 55,
    teamName: 'Barcelona',
    teamColor: '#a50044',
    scorerName: 'Robert Lewandowski',
    isHighlighted: true,
  },
};

export const Deleting: Story = {
  args: {
    id: '7',
    eventType: 'goal',
    gameMinute: 45,
    gameSecond: 0,
    teamName: 'Real Madrid',
    teamColor: '#ffffff',
    scorerName: 'Jude Bellingham',
    isDeleting: true,
  },
};

export const CheckingDependents: Story = {
  args: {
    id: '8',
    eventType: 'substitution',
    gameMinute: 70,
    gameSecond: 30,
    teamName: 'Barcelona',
    teamColor: '#a50044',
    playerInName: 'Ansu Fati',
    playerOutName: 'Ferran Torres',
    isCheckingDependents: true,
  },
};
