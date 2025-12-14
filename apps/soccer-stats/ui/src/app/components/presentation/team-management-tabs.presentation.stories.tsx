import { UITeam } from '../types/ui.types';

import {
  TeamManagementTabs,
  TeamManagementTab,
} from './team-management-tabs.presentation';

const meta = {
  title: 'Components/Presentation/TeamManagementTabs',
  component: TeamManagementTabs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab changed' },
    activeTab: {
      control: 'select',
      options: ['basic', 'format', 'formation', 'positions', 'players'],
    },
    isEditing: {
      control: 'boolean',
    },
    isInSettingsMode: {
      control: 'boolean',
    },
  },
};

export default meta;

// Sample team data
const sampleTeam: UITeam = {
  id: '1',
  name: 'FC Barcelona',
  primaryColor: '#004D98',
  secondaryColor: '#A50044',
  logo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=60',
  playerCount: 25,
  createdAt: '2024-01-15',
};

export const BasicTabActive = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
};

export const FormatTabActive = {
  args: {
    activeTab: 'format' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
};

export const FormationTabActive = {
  args: {
    activeTab: 'formation' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
};

export const PositionsTabActive = {
  args: {
    activeTab: 'positions' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
};

export const PlayersTabActive = {
  args: {
    activeTab: 'players' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
};

export const ViewingMode = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: sampleTeam,
    isEditing: false,
  },
};

export const NewTeam = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: undefined,
    isEditing: true,
  },
};

export const YouthTeam = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: {
      ...sampleTeam,
      name: 'Barcelona Youth Academy U16',
      playerCount: 18,
    },
    isEditing: true,
  },
};

export const WomensTeam = {
  args: {
    activeTab: 'formation' as TeamManagementTab,
    team: {
      ...sampleTeam,
      name: 'Barcelona Femení',
      playerCount: 23,
    },
    isEditing: true,
  },
};

export const TeamWithoutLogo = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: {
      ...sampleTeam,
      logo: undefined,
    },
    isEditing: true,
  },
};

export const SettingsMode = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
    isInSettingsMode: true,
  },
};

export const SettingsModeAllTabs = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
    isInSettingsMode: true,
  },
  render: (args: any) => {
    const allTabs: TeamManagementTab[] = [
      'basic',
      'format',
      'formation',
      'positions',
    ]; // Note: players tab is filtered out in settings mode

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">
            Settings Mode - Players Tab Hidden
          </h2>
          <p className="text-gray-600 mb-6">
            In settings mode, the Players tab is hidden since players are
            managed at the team level navigation.
          </p>
        </div>
        {allTabs.map((tab) => (
          <div key={tab}>
            <h3 className="text-lg font-semibold mb-4 capitalize">{tab} Tab</h3>
            <TeamManagementTabs {...args} activeTab={tab} />
          </div>
        ))}
      </div>
    );
  },
};

export const AllTabsDemo = {
  args: {
    activeTab: 'basic' as TeamManagementTab,
    team: sampleTeam,
    isEditing: true,
  },
  render: (args: any) => {
    const tabs: TeamManagementTab[] = [
      'basic',
      'format',
      'formation',
      'positions',
      'players',
    ];

    return (
      <div className="space-y-8">
        {tabs.map((tab) => (
          <div key={tab}>
            <h3 className="text-lg font-semibold mb-4 capitalize">{tab} Tab</h3>
            <TeamManagementTabs {...args} activeTab={tab} />
          </div>
        ))}
      </div>
    );
  },
};
