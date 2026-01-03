import type { Meta, StoryObj } from '@storybook/react-vite';

import { TabNavigation } from './tab-navigation';

const meta: Meta<typeof TabNavigation> = {
  title: 'Components/TabNavigation',
  component: TabNavigation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabNavigation>;

export const HomeActive: Story = {
  args: {
    activeTab: 'home',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const AwayActive: Story = {
  args: {
    activeTab: 'away',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const RosterActive: Story = {
  args: {
    activeTab: 'roster',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const HistoryActive: Story = {
  args: {
    activeTab: 'history',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const StatsActive: Story = {
  args: {
    activeTab: 'stats',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};
