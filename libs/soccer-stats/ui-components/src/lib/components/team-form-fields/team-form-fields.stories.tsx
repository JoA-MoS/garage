import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { UICreateTeamInput } from '../../types';

import { DEFAULT_TEAM_FORM_VALUES, TeamFormFields } from './team-form-fields';

const meta: Meta<typeof TeamFormFields> = {
  component: TeamFormFields,
  title: 'Components/TeamFormFields',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TeamFormFields>;

// Interactive wrapper for controlled component
const InteractiveTeamFormFields = ({
  initialValue = DEFAULT_TEAM_FORM_VALUES,
  disabled = false,
  error,
}: {
  initialValue?: UICreateTeamInput;
  disabled?: boolean;
  error?: string;
}) => {
  const [value, setValue] = useState<UICreateTeamInput>(initialValue);
  return (
    <TeamFormFields
      value={value}
      onChange={setValue}
      disabled={disabled}
      error={error}
    />
  );
};

// Wrapper component for InForm story to avoid hooks-in-render lint error
const InFormDemo = () => {
  const [value, setValue] = useState<UICreateTeamInput>(
    DEFAULT_TEAM_FORM_VALUES,
  );
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(JSON.stringify(value, null, 2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TeamFormFields value={value} onChange={setValue} />
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Team
        </button>
        <button
          type="button"
          onClick={() => setValue(DEFAULT_TEAM_FORM_VALUES)}
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
      {submitted && (
        <pre className="mt-4 rounded-md bg-gray-100 p-4 text-xs">
          {submitted}
        </pre>
      )}
    </form>
  );
};

export const Default: Story = {
  render: () => <InteractiveTeamFormFields />,
};

export const WithExistingTeam: Story = {
  render: () => (
    <InteractiveTeamFormFields
      initialValue={{
        name: 'Blue Thunder FC',
        homePrimaryColor: '#1e3a8a',
        homeSecondaryColor: '#fbbf24',
        awayPrimaryColor: '#ffffff',
        awaySecondaryColor: '#1e3a8a',
        logoUrl: 'https://example.com/logo.png',
      }}
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <InteractiveTeamFormFields error="Team name is already taken. Please choose a different name." />
  ),
};

export const Disabled: Story = {
  render: () => (
    <InteractiveTeamFormFields
      initialValue={{
        name: 'Red Dragons',
        homePrimaryColor: '#dc2626',
        homeSecondaryColor: '#fef2f2',
        awayPrimaryColor: '#ffffff',
        awaySecondaryColor: '#dc2626',
        logoUrl: '',
      }}
      disabled
    />
  ),
};

export const InForm: Story = {
  render: () => <InFormDemo />,
};
