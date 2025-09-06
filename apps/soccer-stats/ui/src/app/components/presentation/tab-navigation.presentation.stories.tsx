import { TabNavigationPresentation } from './tab-navigation.presentation';

const meta = {
  title: 'Components/Presentation/TabNavigation',
  component: TabNavigationPresentation,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab changed' },
    activeTab: {
      control: 'select',
      options: ['home', 'away', 'stats'],
    },
  },
};

export default meta;

export const HomeTeamActive = {
  args: {
    activeTab: 'home',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const AwayTeamActive = {
  args: {
    activeTab: 'away',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const StatsActive = {
  args: {
    activeTab: 'stats',
    homeTeamName: 'Barcelona',
    awayTeamName: 'Real Madrid',
  },
};

export const LongTeamNames = {
  args: {
    activeTab: 'home',
    homeTeamName: 'Manchester United',
    awayTeamName: 'Borussia Dortmund',
  },
};

export const ShortTeamNames = {
  args: {
    activeTab: 'away',
    homeTeamName: 'AC Milan',
    awayTeamName: 'PSG',
  },
};
