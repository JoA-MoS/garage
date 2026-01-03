import type { Meta, StoryObj } from '@storybook/react-vite';

import { GameDetailsStep } from './game-details-step';

const meta: Meta<typeof GameDetailsStep> = {
  component: GameDetailsStep,
  title: 'Components/GameDetailsStep',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onUpdateGameDetails: { action: 'details-updated' },
  },
};

export default meta;
type Story = StoryObj<typeof GameDetailsStep>;

export const Default: Story = {
  args: {},
};

export const InWizardContext: Story = {
  render: () => (
    <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Create New Game
          </h1>
          <div className="flex space-x-2">
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
              Step 1: Teams ✓
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Step 2: Details
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              Step 3: Review
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <GameDetailsStep
          onUpdateGameDetails={(details) => console.log('Details:', details)}
        />
      </div>
      <div className="flex justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
        <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          ← Back to Teams
        </button>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Continue to Review →
        </button>
      </div>
    </div>
  ),
};
