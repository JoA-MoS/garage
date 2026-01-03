import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserCard } from './user-card';

const meta: Meta<typeof UserCard> = {
  component: UserCard,
  title: 'Components/UserCard',
  tags: ['autodocs'],
  argTypes: {
    onViewClick: { action: 'view clicked' },
    onEditClick: { action: 'edit clicked' },
    onToggleActiveClick: { action: 'toggle active clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof UserCard>;

export const ActivePlayer: Story = {
  args: {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    dateOfBirth: '2010-05-15',
    isActive: true,
    teamCount: 2,
    primaryTeam: 'FC United',
    primaryPosition: 'Midfielder',
    primaryJersey: '10',
    showActions: true,
  },
};

export const InactivePlayer: Story = {
  args: {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    dateOfBirth: '2011-08-22',
    isActive: false,
    teamCount: 1,
    primaryTeam: 'City FC',
    primaryPosition: 'Goalkeeper',
    primaryJersey: '1',
    showActions: true,
  },
};

export const MinimalInfo: Story = {
  args: {
    id: '3',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.j@example.com',
    isActive: true,
    teamCount: 0,
    showActions: true,
  },
};

export const WithoutActions: Story = {
  args: {
    id: '4',
    firstName: 'Sam',
    lastName: 'Wilson',
    email: 'sam.wilson@example.com',
    phone: '(555) 555-5555',
    isActive: true,
    teamCount: 3,
    primaryTeam: 'Red Sox FC',
    primaryPosition: 'Forward',
    primaryJersey: '9',
    showActions: false,
  },
};

export const MultipleTeams: Story = {
  args: {
    id: '5',
    firstName: 'Chris',
    lastName: 'Taylor',
    email: 'chris.taylor@example.com',
    phone: '(555) 111-2222',
    dateOfBirth: '2009-03-10',
    isActive: true,
    teamCount: 4,
    primaryTeam: 'Lightning FC',
    primaryPosition: 'Defender',
    primaryJersey: '4',
    showActions: true,
  },
};
