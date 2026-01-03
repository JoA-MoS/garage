import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImpersonationBanner } from './impersonation-banner';

const meta: Meta<typeof ImpersonationBanner> = {
  title: 'Components/ImpersonationBanner',
  component: ImpersonationBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: "The impersonated user's name",
    },
    onExitImpersonation: {
      action: 'exit-impersonation',
      description: 'Callback when exit button is clicked',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    isExiting: {
      control: 'boolean',
      description: 'Whether the exit action is in progress',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImpersonationBanner>;

export const Default: Story = {
  args: {
    userName: 'John Doe',
    isExiting: false,
  },
};

export const WithLongName: Story = {
  args: {
    userName: 'Alexander Maximilian von Thunderstrike III',
    isExiting: false,
  },
};

export const Exiting: Story = {
  args: {
    userName: 'Jane Smith',
    isExiting: true,
  },
};

export const WithError: Story = {
  args: {
    userName: 'John Doe',
    error: 'Failed to exit impersonation session. Please try again.',
    isExiting: false,
  },
};

export const ExitingWithError: Story = {
  args: {
    userName: 'John Doe',
    error: 'Network error occurred',
    isExiting: true,
  },
};
