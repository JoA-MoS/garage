import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UITeam } from '../../types';

import { TeamDetail, type TeamDetailTab, type TeamOwner } from './team-detail';

const meta: Meta<typeof TeamDetail> = {
  component: TeamDetail,
  title: 'Components/TeamDetail',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    onGoBack: { action: 'go-back' },
    onTabChange: { action: 'tab-changed' },
    onRefresh: { action: 'refresh' },
  },
};

export default meta;
type Story = StoryObj<typeof TeamDetail>;

// Sample teams
const barcelonaTeam: UITeam = {
  id: '1',
  name: 'FC Barcelona',
  homePrimaryColor: '#004D98',
  homeSecondaryColor: '#A50044',
  logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100',
  playerCount: 25,
  createdAt: '2024-01-15',
  isActive: true,
  isManaged: true,
  sourceType: 'INTERNAL',
};

const realMadridTeam: UITeam = {
  id: '2',
  name: 'Real Madrid',
  homePrimaryColor: '#FFFFFF',
  homeSecondaryColor: '#FFD700',
  playerCount: 28,
  createdAt: '2024-01-20',
  isActive: true,
  isManaged: true,
  sourceType: 'INTERNAL',
};

const youthTeam: UITeam = {
  id: '3',
  name: 'Barcelona Youth Academy U16',
  homePrimaryColor: '#004D98',
  homeSecondaryColor: '#A50044',
  playerCount: 18,
  createdAt: '2024-01-15',
  isActive: true,
  isManaged: true,
  sourceType: 'INTERNAL',
};

const newTeam: UITeam = {
  id: '4',
  name: 'New Team FC',
  homePrimaryColor: '#10B981',
  homeSecondaryColor: '#FFFFFF',
  playerCount: 0,
  createdAt: new Date().toISOString(),
  isActive: true,
  isManaged: true,
  sourceType: 'INTERNAL',
};

const sampleOwner: TeamOwner = {
  firstName: 'John',
  lastName: 'Manager',
};

// Sample slot content
const PlayersSlot = () => (
  <div className="rounded-lg bg-gray-50 p-6 text-center">
    <p className="text-gray-600">Players component would be rendered here</p>
    <div className="mt-4 grid grid-cols-3 gap-4">
      {['Player 1', 'Player 2', 'Player 3'].map((name) => (
        <div key={name} className="rounded bg-white p-3 shadow">
          {name}
        </div>
      ))}
    </div>
  </div>
);

const GamesSlot = () => (
  <div className="rounded-lg bg-gray-50 p-6 text-center">
    <p className="text-gray-600">Games component would be rendered here</p>
    <div className="mt-4 space-y-2">
      {['Game 1: Won 3-1', 'Game 2: Draw 2-2', 'Game 3: Won 2-0'].map(
        (game) => (
          <div key={game} className="rounded bg-white p-3 shadow">
            {game}
          </div>
        ),
      )}
    </div>
  </div>
);

const StatsSlot = () => (
  <div className="rounded-lg bg-blue-50 p-6 text-center">
    <p className="text-blue-600">
      Custom stats component would be rendered here
    </p>
    <div className="mt-4 grid grid-cols-4 gap-4">
      <div className="rounded bg-white p-3 shadow">
        <div className="text-2xl font-bold text-blue-600">12</div>
        <div className="text-sm text-gray-600">Wins</div>
      </div>
      <div className="rounded bg-white p-3 shadow">
        <div className="text-2xl font-bold text-yellow-600">3</div>
        <div className="text-sm text-gray-600">Draws</div>
      </div>
      <div className="rounded bg-white p-3 shadow">
        <div className="text-2xl font-bold text-red-600">2</div>
        <div className="text-sm text-gray-600">Losses</div>
      </div>
      <div className="rounded bg-white p-3 shadow">
        <div className="text-2xl font-bold text-green-600">71%</div>
        <div className="text-sm text-gray-600">Win Rate</div>
      </div>
    </div>
  </div>
);

// Interactive wrapper for full functionality
const InteractiveTeamDetail = ({
  team,
  owner,
  initialTab = 'overview',
}: {
  team: UITeam;
  owner?: TeamOwner | null;
  initialTab?: TeamDetailTab;
}) => {
  const [activeTab, setActiveTab] = useState<TeamDetailTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <TeamDetail
      team={team}
      owner={owner}
      activeTab={activeTab}
      onGoBack={() => alert('Navigate back to teams list')}
      onTabChange={setActiveTab}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      playersComponent={<PlayersSlot />}
      gamesComponent={<GamesSlot />}
    />
  );
};

export const Default: Story = {
  render: () => (
    <InteractiveTeamDetail team={barcelonaTeam} owner={sampleOwner} />
  ),
};

export const OverviewTab: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'overview',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const PlayersTab: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'players',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const GamesTab: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'games',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const StatsTabDefault: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'stats',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const StatsTabCustom: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'stats',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
    statsComponent: <StatsSlot />,
  },
};

export const Loading: Story = {
  args: {
    team: barcelonaTeam,
    owner: sampleOwner,
    activeTab: 'overview',
    isLoading: true,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const NoOwner: Story = {
  args: {
    team: barcelonaTeam,
    owner: null,
    activeTab: 'overview',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const NewTeamNoPlayers: Story = {
  args: {
    team: newTeam,
    owner: sampleOwner,
    activeTab: 'overview',
    isLoading: false,
    playersComponent: (
      <div className="py-8 text-center text-gray-500">
        No players yet. Add your first player!
      </div>
    ),
    gamesComponent: (
      <div className="py-8 text-center text-gray-500">
        No games scheduled yet.
      </div>
    ),
  },
};

export const YouthTeamWithOwner: Story = {
  args: {
    team: youthTeam,
    owner: { firstName: 'Coach', lastName: 'Martinez' },
    activeTab: 'overview',
    isLoading: false,
    playersComponent: <PlayersSlot />,
    gamesComponent: <GamesSlot />,
  },
};

export const RealMadridTeam: Story = {
  render: () => (
    <InteractiveTeamDetail
      team={realMadridTeam}
      owner={{ firstName: 'Carlo', lastName: 'Ancelotti' }}
    />
  ),
};
