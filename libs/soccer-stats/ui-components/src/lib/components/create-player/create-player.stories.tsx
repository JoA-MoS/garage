import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UICreatePlayerInput } from '../../types';

import { CreatePlayer } from './create-player';

const meta: Meta<typeof CreatePlayer> = {
  component: CreatePlayer,
  title: 'Components/CreatePlayer',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onInputChange: { action: 'input-changed' },
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof CreatePlayer>;

const DEFAULT_FORM_DATA: UICreatePlayerInput = {
  firstName: '',
  lastName: '',
  email: '',
};

// Interactive wrapper
const InteractiveCreatePlayer = ({
  initialData = DEFAULT_FORM_DATA,
  loading = false,
  error,
}: {
  initialData?: UICreatePlayerInput;
  loading?: boolean;
  error?: string;
}) => {
  const [formData, setFormData] = useState<UICreatePlayerInput>(initialData);

  const handleInputChange = (
    field: keyof UICreatePlayerInput,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.email.trim() !== '';

  return (
    <CreatePlayer
      formData={formData}
      loading={loading}
      error={error}
      isFormValid={isFormValid}
      onInputChange={handleInputChange}
      onSubmit={(e) => {
        e.preventDefault();
        alert(`Creating player: ${formData.firstName} ${formData.lastName}`);
      }}
      onCancel={() => alert('Cancelled')}
    />
  );
};

export const Default: Story = {
  render: () => <InteractiveCreatePlayer />,
};

export const WithData: Story = {
  render: () => (
    <InteractiveCreatePlayer
      initialData={{
        firstName: 'Marcus',
        lastName: 'Johnson',
        email: 'marcus@example.com',
        position: 'Forward',
      }}
    />
  ),
};

export const Loading: Story = {
  args: {
    formData: {
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@example.com',
      position: 'Midfielder',
    },
    loading: true,
    isFormValid: true,
  },
};

export const WithError: Story = {
  render: () => (
    <InteractiveCreatePlayer error="A player with this email already exists." />
  ),
};

export const InvalidForm: Story = {
  args: {
    formData: {
      firstName: 'John',
      lastName: '',
      email: '',
    },
    loading: false,
    isFormValid: false,
  },
};
